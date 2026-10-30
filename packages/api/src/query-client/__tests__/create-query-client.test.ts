import { type QueryClient, QueryObserver, type QueryObserverResult } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ApiError, isApiError } from '../../core';
import { movieQueries } from '../../queries';
import { MAX_RETRIES, createQueryClient, shouldRetry } from '../create-query-client';

// @repo/api cannot use @repo/test-utils (that package depends on @repo/api), so it owns its server.
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('shouldRetry', () => {
  it.each([
    ['network', true],
    ['server', true],
    ['not_found', false],
    ['client', false],
    ['validation', false],
  ] as const)('retries a %s error: %s', (kind, expected) => {
    expect(shouldRetry(0, new ApiError(kind, 'failed'))).toBe(expected);
  });

  it('stops after MAX_RETRIES', () => {
    const error = new ApiError('server', 'failed', { status: 503 });

    expect(shouldRetry(MAX_RETRIES - 1, error)).toBe(true);
    expect(shouldRetry(MAX_RETRIES, error)).toBe(false);
  });

  it('does not retry aborts or programming errors', () => {
    expect(shouldRetry(0, new DOMException('Aborted', 'AbortError'))).toBe(false);
    expect(shouldRetry(0, new TypeError('x is undefined'))).toBe(false);
  });
});

describe('createQueryClient', () => {
  let queryClient: QueryClient;
  let requestCount: number;

  beforeEach(() => {
    queryClient = createQueryClient();
    // Backoff is TanStack's; the tests only count attempts.
    queryClient.setDefaultOptions({
      queries: { ...queryClient.getDefaultOptions().queries, retryDelay: 0 },
    });
    requestCount = 0;
  });

  afterEach(() => queryClient.clear());

  function respondWith(response: () => Response): void {
    server.use(
      http.get('*/api/tmdb/movie/:id', () => {
        requestCount += 1;
        return response();
      })
    );
  }

  it('does not retry a 404', async () => {
    respondWith(() => new HttpResponse(null, { status: 404 }));

    const result = await settle(queryClient);

    expect(requestCount).toBe(1);
    expect(isApiError(result.error) && result.error.kind).toBe('not_found');
  });

  it('retries a 500 twice', async () => {
    respondWith(() => new HttpResponse(null, { status: 500 }));

    const result = await settle(queryClient);

    expect(requestCount).toBe(1 + MAX_RETRIES);
    expect(isApiError(result.error) && result.error.kind).toBe('server');
  });

  it('does not retry invalid JSON', async () => {
    respondWith(() => new HttpResponse('{not json', { status: 200 }));

    const result = await settle(queryClient);

    expect(requestCount).toBe(1);
    expect(isApiError(result.error) && result.error.kind).toBe('validation');
  });
});

/** Observes the query like a component would (with retries) until it fails or succeeds. */
function settle(queryClient: QueryClient): Promise<QueryObserverResult<unknown, unknown>> {
  const observer = new QueryObserver(queryClient, movieQueries.detail(1));
  return new Promise((resolve) => {
    const unsubscribe = observer.subscribe((result) => {
      if (result.status === 'pending') return;
      unsubscribe();
      resolve(result);
    });
  });
}
