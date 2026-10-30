import { describe, expect, it } from 'vitest';
import { genreQueries } from '../genre';
import { movieQueries } from '../movie';
import { searchQueries } from '../search';
import { STALE_TIME_REFERENCE } from '../stale-time';
import { trendingQueries } from '../trending';

describe('query keys', () => {
  it('nests movie keys under one root so any level can be invalidated', () => {
    expect(movieQueries.list('popular').queryKey).toEqual(['movies', 'list', 'popular']);
    expect(movieQueries.detail(42).queryKey).toEqual(['movies', 'detail', 42]);
    expect(movieQueries.list('popular').queryKey.slice(0, 2)).toEqual(movieQueries.lists());
  });

  it('keeps the first-page row apart from the infinite list of the same category', () => {
    expect(movieQueries.row('popular').queryKey).toEqual([
      'movies',
      'list',
      'popular',
      'first-page',
    ]);
    expect(trendingQueries.row('movie', 'day').queryKey).toEqual([
      'trending',
      'list',
      'movie',
      'day',
      'first-page',
    ]);
  });

  it('keys discover lists by genre and sort, under the movie lists', () => {
    const options = movieQueries.discover({ genreId: 28, sortBy: 'vote_average.desc' });

    expect(options.queryKey).toEqual([
      'movies',
      'list',
      'discover',
      { genreId: 28, sortBy: 'vote_average.desc' },
    ]);
    expect(options.queryKey.slice(0, 2)).toEqual(movieQueries.lists());
  });

  it('marks the Movies page queries as showing their errors inline', () => {
    expect(movieQueries.discover({ genreId: null, sortBy: 'popularity.desc' }).meta).toEqual({
      inlineErrors: true,
    });
    expect(searchQueries.movies('dune').meta).toEqual({ inlineErrors: true });
  });

  it('puts the query text, not the page, in the search key', () => {
    expect(searchQueries.movies('dune').queryKey).toEqual(['search', 'movies', 'dune']);
  });

  it('caches genres for the whole session', () => {
    expect(genreQueries.movie().staleTime).toBe(STALE_TIME_REFERENCE);
  });
});
