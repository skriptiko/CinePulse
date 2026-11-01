import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { DISCOVER_MIN_VOTE_COUNT } from '../movie';
import { discoverTV, getTVDetails } from '../tv';

// @repo/api cannot use @repo/test-utils (that package depends on @repo/api), so it owns its server.
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('getTVDetails', () => {
  it('asks for every section of the details page in one request', async () => {
    const requests: URL[] = [];
    server.use(
      http.get('*/api/tmdb/tv/:id', ({ request }) => {
        requests.push(new URL(request.url));
        return HttpResponse.json({ id: 42 });
      })
    );

    await getTVDetails(42);

    expect(requests).toHaveLength(1);
    expect(requests[0]?.pathname).toBe('/api/tmdb/tv/42');
    expect(Object.fromEntries(requests[0]?.searchParams ?? [])).toEqual({
      append_to_response: 'credits,videos,images,recommendations,similar,reviews,watch/providers',
    });
  });
});

describe('discoverTV', () => {
  function captureDiscover(): { params: () => URLSearchParams; path: () => string } {
    let url: URL | undefined;
    server.use(
      http.get('*/api/tmdb/discover/tv', ({ request }) => {
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

    await discoverTV({ genreId: 18, sortBy: 'popularity.desc', page: 3 });

    expect(request.path()).toBe('/api/tmdb/discover/tv');
    expect(Object.fromEntries(request.params())).toEqual({
      page: '3',
      with_genres: '18',
      sort_by: 'popularity.desc',
    });
  });

  it('omits the genre when it is null', async () => {
    const request = captureDiscover();

    await discoverTV({ genreId: null, sortBy: 'popularity.desc' });

    expect(request.params().has('with_genres')).toBe(false);
  });

  it('adds a vote floor to the rating sort', async () => {
    const request = captureDiscover();

    await discoverTV({ sortBy: 'vote_average.desc' });

    expect(request.params().get('vote_count.gte')).toBe(String(DISCOVER_MIN_VOTE_COUNT));
    expect(request.params().has('first_air_date.lte')).toBe(false);
  });

  it('limits the newest sort to shows first aired by today', async () => {
    const request = captureDiscover();

    await discoverTV({ sortBy: 'first_air_date.desc' });

    expect(request.params().get('first_air_date.lte')).toBe(new Date().toISOString().slice(0, 10));
    expect(request.params().has('primary_release_date.lte')).toBe(false);
    expect(request.params().has('vote_count.gte')).toBe(false);
  });
});
