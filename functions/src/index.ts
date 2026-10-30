import { logger } from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';
import {
  CACHE_CONTROL_NO_STORE,
  mapUpstreamError,
  type ProxyError,
  resolveProxyRequest,
  UPSTREAM_UNAVAILABLE,
} from './proxy-rules.js';

const TMDB_API_READ_TOKEN = defineSecret('TMDB_API_READ_TOKEN');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const UPSTREAM_TIMEOUT_MS = 10_000;
const ALLOWED_METHODS = 'GET, HEAD';

/** The slice of the Express response the error helper needs (express is not a direct dep). */
type ErrorResponse = {
  status: (code: number) => ErrorResponse;
  set: (field: string, value: string) => ErrorResponse;
  json: (body: unknown) => unknown;
};

function sendError(res: ErrorResponse, { status, error }: ProxyError): void {
  res.status(status).set('Cache-Control', CACHE_CONTROL_NO_STORE).json({ error });
}

/** Error name only (`TimeoutError`, `TypeError`...): messages may carry request details. */
function errorReason(error: unknown): string {
  return error instanceof Error ? error.name : 'unknown';
}

/**
 * Read-only TMDB proxy behind the Hosting rewrite `/api/tmdb/**`. Only allowlisted paths and
 * query params reach TMDB; the token stays server-side and upstream errors are neutralised.
 */
export const tmdbProxy = onRequest(
  {
    secrets: [TMDB_API_READ_TOKEN],
    // Same-origin only: the browser reaches the function through the Hosting rewrite.
    cors: false,
    // Caps billable instances on the Blaze plan.
    maxInstances: 2,
  },
  async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.set('Allow', ALLOWED_METHODS);
      sendError(res, { status: 405, error: 'Method not allowed' });
      return;
    }

    const queryStart = req.url.indexOf('?');
    const query = queryStart === -1 ? '' : req.url.slice(queryStart + 1);
    const resolved = resolveProxyRequest(req.path, new URLSearchParams(query));
    if (!resolved.ok) {
      sendError(res, resolved.error);
      return;
    }
    const { target } = resolved;

    const token = TMDB_API_READ_TOKEN.value();
    if (!token) {
      logger.error('tmdbProxy: TMDB_API_READ_TOKEN is not configured');
      sendError(res, { status: 500, error: 'Proxy misconfigured' });
      return;
    }

    let upstream: Response;
    try {
      upstream = await fetch(`${TMDB_BASE_URL}${target.path}${target.search}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });
    } catch (error) {
      // Path only: the query may hold user search input.
      logger.error('tmdbProxy: upstream request failed', {
        path: target.path,
        reason: errorReason(error),
      });
      sendError(res, UPSTREAM_UNAVAILABLE);
      return;
    }

    if (!upstream.ok) {
      await upstream.body?.cancel();
      const mapped = mapUpstreamError(upstream.status, upstream.headers.get('Retry-After'));
      if (mapped.status !== 404) {
        logger.warn('tmdbProxy: upstream error', { path: target.path, status: upstream.status });
      }
      if (mapped.retryAfter) {
        res.set('Retry-After', mapped.retryAfter);
      }
      sendError(res, mapped);
      return;
    }

    let body: string;
    try {
      body = await upstream.text();
    } catch (error) {
      logger.error('tmdbProxy: upstream body failed', {
        path: target.path,
        reason: errorReason(error),
      });
      sendError(res, UPSTREAM_UNAVAILABLE);
      return;
    }

    res
      .status(upstream.status)
      .set('Cache-Control', target.cacheControl)
      .type('application/json')
      .send(body);
  }
);
