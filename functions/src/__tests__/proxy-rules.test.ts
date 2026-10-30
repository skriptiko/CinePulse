import { describe, expect, it } from 'vitest';
import {
  CACHE_CONTROL_DEFAULT,
  CACHE_CONTROL_LONG,
  mapUpstreamError,
  resolveProxyRequest,
  toTmdbPath,
} from '../proxy-rules.js';

function resolve(path: string, query = '') {
  return resolveProxyRequest(path, new URLSearchParams(query));
}

describe('toTmdbPath', () => {
  it('strips the Hosting rewrite prefix', () => {
    expect(toTmdbPath('/api/tmdb/movie/popular')).toBe('/movie/popular');
    expect(toTmdbPath('/api/tmdb')).toBe('/');
  });

  it('keeps a path without the prefix (emulator / direct call)', () => {
    expect(toTmdbPath('/movie/popular')).toBe('/movie/popular');
    expect(toTmdbPath('/api/tmdbx/movie')).toBe('/api/tmdbx/movie');
  });
});

describe('resolveProxyRequest: paths', () => {
  it.each([
    '/movie/popular',
    '/movie/top_rated',
    '/movie/upcoming',
    '/movie/now_playing',
    '/movie/550',
    '/tv/popular',
    '/tv/top_rated',
    '/tv/on_the_air',
    '/tv/airing_today',
    '/tv/1399',
    '/trending/all/day',
    '/trending/movie/week',
    '/trending/tv/day',
    '/trending/person/week',
    '/genre/movie/list',
    '/genre/tv/list',
    '/person/287',
  ])('allows %s', (path) => {
    const result = resolve(`/api/tmdb${path}`);
    expect(result).toEqual({
      ok: true,
      target: { path, search: '', cacheControl: expect.any(String) },
    });
  });

  it.each([
    '/',
    '/movie',
    '/movie/latest',
    '/movie/550/credits',
    '/movie/0',
    '/movie/-1',
    '/movie/abc',
    '/movie/popular/',
    '/tv/1399/season/1',
    '/trending/movie/month',
    '/trending/collection/day',
    '/genre/person/list',
    '/person/popular',
    '/account',
    '/authentication/token/new',
    '/movie/550/../../account',
    '/MOVIE/popular',
  ])('rejects %s with 404', (path) => {
    expect(resolve(`/api/tmdb${path}`)).toEqual({
      ok: false,
      error: { status: 404, error: 'Not found' },
    });
  });

  it('caches genre lists longer than the rest', () => {
    const genres = resolve('/api/tmdb/genre/movie/list');
    const movie = resolve('/api/tmdb/movie/550');
    expect(genres.ok && genres.target.cacheControl).toBe(CACHE_CONTROL_LONG);
    expect(movie.ok && movie.target.cacheControl).toBe(CACHE_CONTROL_DEFAULT);
  });
});

describe('resolveProxyRequest: query', () => {
  const BAD_REQUEST = { ok: false, error: { status: 400, error: 'Invalid query parameters' } };

  it('forwards a valid page on list routes', () => {
    const result = resolve('/api/tmdb/movie/popular', 'page=2');
    expect(result.ok && result.target.search).toBe('?page=2');
  });

  it.each(['1', '500'])('accepts page=%s', (page) => {
    expect(resolve('/api/tmdb/trending/all/day', `page=${page}`).ok).toBe(true);
  });

  it.each(['0', '501', '01', '-1', '1.5', 'abc', '', '1e2', '9999'])('rejects page=%s', (page) => {
    expect(resolve('/api/tmdb/tv/popular', `page=${page}`)).toEqual(BAD_REQUEST);
  });

  it('rejects unknown params', () => {
    expect(resolve('/api/tmdb/movie/popular', 'page=1&language=en-US')).toEqual(BAD_REQUEST);
    expect(resolve('/api/tmdb/movie/popular', 'api_key=x')).toEqual(BAD_REQUEST);
  });

  it('rejects repeated params', () => {
    expect(resolve('/api/tmdb/movie/popular', 'page=1&page=2')).toEqual(BAD_REQUEST);
  });

  it('rejects any params on detail and genre routes', () => {
    expect(resolve('/api/tmdb/movie/550', 'page=1')).toEqual(BAD_REQUEST);
    expect(resolve('/api/tmdb/genre/tv/list', 'query=x')).toEqual(BAD_REQUEST);
  });

  it('requires a non-empty query on search routes', () => {
    expect(resolve('/api/tmdb/search/movie')).toEqual(BAD_REQUEST);
    expect(resolve('/api/tmdb/search/movie', 'query=%20%20')).toEqual(BAD_REQUEST);
    expect(resolve('/api/tmdb/search/movie', 'page=1')).toEqual(BAD_REQUEST);
  });

  it('rebuilds the search query string, trimmed and encoded', () => {
    const result = resolve('/api/tmdb/search/multi', 'page=3&query=%20star%20wars%20');
    expect(result.ok && result.target.search).toBe('?query=star+wars&page=3');
  });

  it('caps the query length', () => {
    const atLimit = 'a'.repeat(100);
    expect(resolve('/api/tmdb/search/tv', `query=${atLimit}`).ok).toBe(true);
    expect(resolve('/api/tmdb/search/tv', `query=${atLimit}a`)).toEqual(BAD_REQUEST);
  });

  it('rejects query on non-search routes', () => {
    expect(resolve('/api/tmdb/movie/popular', 'query=x')).toEqual(BAD_REQUEST);
  });
});

describe('mapUpstreamError', () => {
  it('passes 404 through', () => {
    expect(mapUpstreamError(404)).toEqual({ status: 404, error: 'Not found' });
  });

  it('maps 429 to 503 with a numeric Retry-After', () => {
    expect(mapUpstreamError(429, '10')).toEqual({
      status: 503,
      error: 'Upstream rate limited',
      retryAfter: '10',
    });
  });

  it('drops a missing or non-numeric Retry-After', () => {
    expect(mapUpstreamError(429)).toEqual({ status: 503, error: 'Upstream rate limited' });
    expect(mapUpstreamError(429, 'Wed, 21 Oct 2026 07:28:00 GMT')).not.toHaveProperty('retryAfter');
  });

  it.each([500, 502, 503, 504, 400, 401, 403, 422])('maps %i to a neutral 502', (status) => {
    expect(mapUpstreamError(status)).toEqual({ status: 502, error: 'Upstream unavailable' });
  });
});
