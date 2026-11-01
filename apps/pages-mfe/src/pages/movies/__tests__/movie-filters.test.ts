import { SEARCH_QUERY_MAX_LENGTH } from '@repo/api';
import { describe, expect, it } from 'vitest';
import { parseMovieFilters, SORT_OPTIONS, toDiscoverSortBy } from '../use-movie-filters';

function parse(search: string) {
  return parseMovieFilters(new URLSearchParams(search));
}

describe('parseMovieFilters', () => {
  it('defaults to every genre, popular, no search', () => {
    expect(parse('')).toEqual({ query: '', genreId: null, sort: 'popular' });
  });

  it('reads a valid URL', () => {
    expect(parse('q=dune&genre=878&sort=rating')).toEqual({
      query: 'dune',
      genreId: 878,
      sort: 'rating',
    });
  });

  it('trims the query and caps its length', () => {
    expect(parse('q=%20%20star%20wars%20').query).toBe('star wars');
    expect(parse(`q=${'a'.repeat(SEARCH_QUERY_MAX_LENGTH + 20)}`).query).toHaveLength(
      SEARCH_QUERY_MAX_LENGTH
    );
    expect(parse('q=%20%20').query).toBe('');
  });

  it.each(['abc', '0', '-5', '1.5', '28,12', '', '01', '12345678901'])(
    'falls back to every genre for genre=%s',
    (genre) => {
      expect(parse(`genre=${genre}`).genreId).toBeNull();
    }
  );

  it.each(['', 'Rating', 'oldest', 'popularity.desc'])(
    'falls back to popular for sort=%s',
    (sort) => {
      expect(parse(`sort=${sort}`).sort).toBe('popular');
    }
  );
});

describe('toDiscoverSortBy', () => {
  it('maps every sort option to a TMDB sort_by', () => {
    expect(SORT_OPTIONS.map(toDiscoverSortBy)).toEqual([
      'popularity.desc',
      'primary_release_date.desc',
      'vote_average.desc',
    ]);
  });
});
