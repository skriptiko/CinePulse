import { http, HttpResponse, delay } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { apiGet } from '../client';
import { ApiError } from '../errors';

// @repo/api cannot use @repo/test-utils (that package depends on @repo/api), so it owns its server.
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const ENDPOINT = '*/api/tmdb/movie/popular';

function getError(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(
    () => {
      throw new Error('Expected the request to fail');
    },
    (error: unknown) => error
  );
}

describe('apiGet', () => {
  it('requests the proxy with the query string and returns the JSON body', async () => {
    let requestedUrl = '';
    server.use(
      http.get(ENDPOINT, ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json({ page: 3 });
      })
    );

    const data = await apiGet<{ page: number }>('/movie/popular', { params: { page: 3 } });

    expect(new URL(requestedUrl).pathname).toBe('/api/tmdb/movie/popular');
    expect(new URL(requestedUrl).search).toBe('?page=3');
    expect(data).toEqual({ page: 3 });
  });

  it.each([
    [404, 'not_found'],
    [401, 'client'],
    [429, 'server'],
    [500, 'server'],
    [503, 'server'],
  ] as const)('rejects status %i with an ApiError of kind %s', async (status, kind) => {
    server.use(http.get(ENDPOINT, () => new HttpResponse(null, { status })));

    const error = await getError(apiGet('/movie/popular'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind, status });
  });

  it('wraps a network failure into the network kind and keeps the cause', async () => {
    server.use(http.get(ENDPOINT, () => HttpResponse.error()));

    const error = await getError(apiGet('/movie/popular'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: 'network', status: undefined });
    expect((error as ApiError).cause).toBeInstanceOf(TypeError);
  });

  it('turns a broken JSON body into the validation kind', async () => {
    server.use(
      http.get(
        ENDPOINT,
        () => new HttpResponse('{"page":', { headers: { 'Content-Type': 'application/json' } })
      )
    );

    const error = await getError(apiGet('/movie/popular'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: 'validation', status: 200 });
    expect((error as ApiError).cause).toBeInstanceOf(SyntaxError);
  });

  it('rethrows an abort as is, not as an ApiError', async () => {
    server.use(
      http.get(ENDPOINT, async () => {
        await delay('infinite');
        return HttpResponse.json({});
      })
    );
    const controller = new AbortController();

    const pending = getError(apiGet('/movie/popular', { signal: controller.signal }));
    controller.abort();
    const error = await pending;

    expect(error).not.toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ name: 'AbortError' });
  });

  it('rethrows a custom abort reason unchanged', async () => {
    const reason = new Error('navigated away');

    const error = await getError(apiGet('/movie/popular', { signal: AbortSignal.abort(reason) }));

    expect(error).toBe(reason);
  });
});
