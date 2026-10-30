import { delay, HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ApiError } from '../../core';
import { DISCOVER_MIN_VOTE_COUNT, discoverMovies, getMovies } from '../movie';

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
    expect(error).toMatchObject({ kind: 'not_found', status: 404 });
  });

  it('passes the signal through, so an aborted request rejects with AbortError', async () => {
    server.use(
      http.get('*/api/tmdb/movie/:category', async () => {
        await delay('infinite');
        return HttpResponse.json({});
      })
    );
    const controller = new AbortController();

    const pending = getMovies('popular', {}, { signal: controller.signal }).catch(
      (caught: unknown) => caught
    );
    controller.abort();

    expect(await pending).toMatchObject({ name: 'AbortError' });
  });

  it('accepts only known params', () => {
    // Compile-time check (tsc runs over tests): no index signature on PageParams.
    // @ts-expect-error: `sort` is not a PageParams key.
    const call = (): unknown => getMovies('popular', { sort: 'asc' });

    expect(call).toBeTypeOf('function');
  });
});

describe('discoverMovies', () => {
  function captureDiscover(): { params: () => URLSearchParams; path: () => string } {
    let url: URL | undefined;
    server.use(
      http.get('*/api/tmdb/discover/movie', ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json({ page: 1, results: [], total_pages: 1, total_results: 0 });
      })
    );
    return {
      params: () => url?.searchParams ?? new URLSearchParams(),
      path: () => url?.pathname ?? '',
    };
  }

  it('sends the genre, sort and page', async () => {
    const request = captureDiscover();

    await discoverMovies({ genreId: 28, sortBy: 'popularity.desc', page: 3 });

    expect(request.path()).toBe('/api/tmdb/discover/movie');
    expect(Object.fromEntries(request.params())).toEqual({
      page: '3',
      with_genres: '28',
      sort_by: 'popularity.desc',
    });
  });

  it('omits the genre when it is null', async () => {
    const request = captureDiscover();

    await discoverMovies({ genreId: null, sortBy: 'popularity.desc' });

    expect(request.params().has('with_genres')).toBe(false);
  });

  it('adds a vote floor to the rating sort', async () => {
    const request = captureDiscover();

    await discoverMovies({ sortBy: 'vote_average.desc' });

    expect(request.params().get('vote_count.gte')).toBe(String(DISCOVER_MIN_VOTE_COUNT));
    expect(request.params().has('primary_release_date.lte')).toBe(false);
  });

  it('limits the newest sort to films released by today', async () => {
    const request = captureDiscover();

    await discoverMovies({ sortBy: 'primary_release_date.desc' });

    expect(request.params().get('primary_release_date.lte')).toBe(
      new Date().toISOString().slice(0, 10)
    );
    expect(request.params().has('vote_count.gte')).toBe(false);
  });
});
