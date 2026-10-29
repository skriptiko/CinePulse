import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ApiError } from '../../core';
import { getMovies } from '../movies';

// @repo/api cannot use @repo/test-utils (that package depends on @repo/api), so it owns its server.
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('getMovies', () => {
  it('requests the category through the proxy and returns the page', async () => {
    let requestedUrl = '';
    server.use(
      http.get('*/api/tmdb/movie/:category', ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json({ page: 2, results: [], total_pages: 5, total_results: 90 });
      })
    );

    const response = await getMovies('top_rated', { page: 2 });

    expect(new URL(requestedUrl).pathname).toBe('/api/tmdb/movie/top_rated');
    expect(new URL(requestedUrl).searchParams.get('page')).toBe('2');
    expect(response.total_pages).toBe(5);
  });

  it('throws ApiError with the HTTP status when the request fails', async () => {
    server.use(
      http.get('*/api/tmdb/movie/:category', () => new HttpResponse(null, { status: 404 }))
    );

    const error = await getMovies('popular').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, isNetworkError: false });
  });
});
