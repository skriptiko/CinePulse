/**
 * Pure request/response rules of `tmdbProxy`: no I/O, so they are unit-tested in isolation.
 * The allowlist mirrors exactly what `@repo/api` calls (`packages/api/src/endpoints`).
 */

export const PROXY_PREFIX = '/api/tmdb';

export const MAX_PAGE = 500;
export const MAX_QUERY_LENGTH = 100; // keep equal to SEARCH_QUERY_MAX_LENGTH in @repo/api

export const CACHE_CONTROL_DEFAULT = 'public, max-age=300, s-maxage=3600';
/** Genre lists change rarely. */
export const CACHE_CONTROL_LONG = 'public, max-age=3600, s-maxage=86400';
export const CACHE_CONTROL_NO_STORE = 'no-store';

/** `sort_by` values `discoverMovies` sends. */
export const DISCOVER_SORT_BY = [
  'popularity.desc',
  'primary_release_date.desc',
  'vote_average.desc',
] as const;
export const MAX_VOTE_COUNT_FLOOR = 10_000;

type QueryRule = 'page' | 'search' | 'discover';

type RouteRule = {
  pattern: RegExp;
  /**
   * `page`: optional `page`; `search`: required `query` + optional `page`; `discover`:
   * required `sort_by` + optional `page`, `with_genres`, `vote_count.gte`,
   * `primary_release_date.lte`; none: no params.
   */
  query?: QueryRule;
  cacheControl: string;
};

const ID = '[1-9]\\d{0,9}';
const ID_PATTERN = new RegExp(`^${ID}$`);

const ROUTES: readonly RouteRule[] = [
  {
    pattern: /^\/movie\/(popular|top_rated|upcoming|now_playing)$/,
    query: 'page',
    cacheControl: CACHE_CONTROL_DEFAULT,
  },
  { pattern: new RegExp(`^/movie/${ID}$`), cacheControl: CACHE_CONTROL_DEFAULT },
  { pattern: /^\/discover\/movie$/, query: 'discover', cacheControl: CACHE_CONTROL_DEFAULT },
  {
    pattern: /^\/tv\/(popular|top_rated|on_the_air|airing_today)$/,
    query: 'page',
    cacheControl: CACHE_CONTROL_DEFAULT,
  },
  { pattern: new RegExp(`^/tv/${ID}$`), cacheControl: CACHE_CONTROL_DEFAULT },
  {
    pattern: /^\/trending\/(all|movie|tv|person)\/(day|week)$/,
    query: 'page',
    cacheControl: CACHE_CONTROL_DEFAULT,
  },
  {
    pattern: /^\/search\/(multi|movie|tv|person)$/,
    query: 'search',
    cacheControl: CACHE_CONTROL_DEFAULT,
  },
  { pattern: /^\/genre\/(movie|tv)\/list$/, cacheControl: CACHE_CONTROL_LONG },
  { pattern: new RegExp(`^/person/${ID}$`), cacheControl: CACHE_CONTROL_DEFAULT },
];

export type ProxyError = {
  status: number;
  error: string;
};

export type ProxyTarget = {
  /** TMDB path, e.g. `/movie/popular`. */
  path: string;
  /** Rebuilt query string with a leading `?`, or an empty string. */
  search: string;
  /** `Cache-Control` for a successful upstream response. */
  cacheControl: string;
};

export type ResolveResult = { ok: true; target: ProxyTarget } | { ok: false; error: ProxyError };

const NOT_FOUND: ProxyError = { status: 404, error: 'Not found' };
const BAD_REQUEST: ProxyError = { status: 400, error: 'Invalid query parameters' };
export const UPSTREAM_UNAVAILABLE: ProxyError = { status: 502, error: 'Upstream unavailable' };

/** Strips the Hosting rewrite prefix: the function sees the full `/api/tmdb/...` path. */
export function toTmdbPath(requestPath: string): string {
  if (requestPath === PROXY_PREFIX) return '/';
  if (requestPath.startsWith(`${PROXY_PREFIX}/`)) return requestPath.slice(PROXY_PREFIX.length);
  return requestPath;
}

/**
 * Validates the path against the allowlist and rebuilds the query string from allowed
 * params only. Unknown or repeated params are rejected, not dropped, so the CDN cache
 * cannot be busted with junk params.
 */
export function resolveProxyRequest(requestPath: string, params: URLSearchParams): ResolveResult {
  const path = toTmdbPath(requestPath);
  const rule = ROUTES.find((route) => route.pattern.test(path));
  if (!rule) return { ok: false, error: NOT_FOUND };

  const search = sanitizeQuery(params, rule.query);
  if (search === null) return { ok: false, error: BAD_REQUEST };

  return { ok: true, target: { path, search, cacheControl: rule.cacheControl } };
}

const ALLOWED_PARAMS: Record<QueryRule, readonly string[]> = {
  page: ['page'],
  search: ['query', 'page'],
  discover: ['sort_by', 'with_genres', 'vote_count.gte', 'primary_release_date.lte', 'page'],
};

function sanitizeQuery(params: URLSearchParams, rule: QueryRule | undefined): string | null {
  const allowed = rule ? ALLOWED_PARAMS[rule] : [];
  const keys = [...params.keys()];
  const hasUnknownOrRepeated =
    keys.some((key) => !allowed.includes(key)) || new Set(keys).size !== keys.length;
  if (hasUnknownOrRepeated) return null;

  const result = new URLSearchParams();

  if (rule === 'search') {
    const query = params.get('query')?.trim() ?? '';
    if (query.length === 0 || query.length > MAX_QUERY_LENGTH) return null;
    result.set('query', query);
  }

  if (rule === 'discover' && !copyDiscoverParams(params, result)) return null;

  const page = params.get('page');
  if (page !== null) {
    if (!isValidPage(page)) return null;
    result.set('page', page);
  }

  const search = result.toString();
  return search ? `?${search}` : '';
}

/** Validates the discover params and copies them in a fixed order; `false` if any is invalid. */
function copyDiscoverParams(params: URLSearchParams, result: URLSearchParams): boolean {
  const sortBy = params.get('sort_by');
  const sortValues: readonly string[] = DISCOVER_SORT_BY;
  if (sortBy === null || !sortValues.includes(sortBy)) return false;
  result.set('sort_by', sortBy);

  const genre = params.get('with_genres');
  if (genre !== null) {
    if (!ID_PATTERN.test(genre)) return false;
    result.set('with_genres', genre);
  }

  const voteCount = params.get('vote_count.gte');
  if (voteCount !== null) {
    if (!/^(0|[1-9]\d{0,4})$/.test(voteCount) || Number(voteCount) > MAX_VOTE_COUNT_FLOOR) {
      return false;
    }
    result.set('vote_count.gte', voteCount);
  }

  const releasedBy = params.get('primary_release_date.lte');
  if (releasedBy !== null) {
    if (!isValidIsoDate(releasedBy)) return false;
    result.set('primary_release_date.lte', releasedBy);
  }

  return true;
}

/** A real calendar date as `YYYY-MM-DD`. */
function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidPage(value: string): boolean {
  return /^[1-9]\d{0,2}$/.test(value) && Number(value) <= MAX_PAGE;
}

export type UpstreamErrorResponse = ProxyError & {
  /** Sanitised `Retry-After` (delay in seconds), only for a rate-limited upstream. */
  retryAfter?: string;
};

/**
 * Maps a non-OK TMDB status to a neutral client response. Upstream bodies and messages
 * are never forwarded.
 */
export function mapUpstreamError(
  status: number,
  retryAfter: string | null = null
): UpstreamErrorResponse {
  if (status === 404) return NOT_FOUND;
  if (status === 429) {
    const seconds = retryAfter?.trim();
    return {
      status: 503,
      error: 'Upstream rate limited',
      ...(seconds && /^\d{1,5}$/.test(seconds) ? { retryAfter: seconds } : {}),
    };
  }
  // 5xx, and any other 4xx (e.g. 401 for a bad token): our side or TMDB, never the client.
  return UPSTREAM_UNAVAILABLE;
}
