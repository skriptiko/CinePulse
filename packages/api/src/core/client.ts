import { API_CONFIG } from './config';
import { ApiError, isAbortError, toHttpError } from './errors';
import { buildQueryString } from './utils';

export type QueryParams = Record<string, string | number | boolean | undefined>;

export type RequestOptions = {
  params?: QueryParams;
  signal?: AbortSignal;
};

/**
 * GET through the TMDB proxy. Rejects with `ApiError` for any failure, except an abort,
 * which is rethrown as is. The transport never shows UI and never emits events.
 */
export async function apiGet<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, signal } = options;
  const queryString = params ? buildQueryString(params) : '';
  const url = `${API_CONFIG.PROXY_BASE_URL}${endpoint}${queryString}`;

  const response = await request(url, signal);
  if (!response.ok) {
    throw toHttpError(response);
  }
  return parseJson<T>(response);
}

async function request(url: string, signal: AbortSignal | undefined): Promise<Response> {
  try {
    return await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal,
    });
  } catch (error) {
    // `abort(reason)` rejects with the reason itself, so the signal state is checked too.
    const isAborted = signal?.aborted === true || isAbortError(error);
    if (isAborted) {
      throw error;
    }
    throw new ApiError('network', 'Network request failed', { cause: error });
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch (error) {
    // An abort while the body is streaming also rejects `json()`.
    if (isAbortError(error)) {
      throw error;
    }
    throw new ApiError('validation', 'Invalid JSON in the response', {
      status: response.status,
      cause: error,
    });
  }
}
