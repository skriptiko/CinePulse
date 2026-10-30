import { buildMovie, buildTv } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { toMovieCardData, toTrendingCardData, toTvCardData } from '../movie-card';

describe('toMovieCardData', () => {
  it('maps a movie to a card with a w342 poster', () => {
    const movie = buildMovie({
      title: 'Dune',
      poster_path: '/dune.jpg',
      release_date: '2021-09-15',
      vote_average: 7.84,
    });

    expect(toMovieCardData(movie)).toEqual({
      id: movie.id,
      title: 'Dune',
      imageUrl: 'https://image.tmdb.org/t/p/w342/dune.jpg',
      year: '2021',
      rating: '7.8',
      href: `/movies/${movie.id}`,
    });
  });

  it('uses null for a missing poster and release date', () => {
    const card = toMovieCardData(buildMovie({ poster_path: null, release_date: '' }));

    expect(card.imageUrl).toBeNull();
    expect(card.year).toBeNull();
  });

  it('keeps a rating of 0', () => {
    expect(toMovieCardData(buildMovie({ vote_average: 0 })).rating).toBe('0.0');
  });
});

describe('toTvCardData', () => {
  it('maps a show by its name and first air date', () => {
    const tv = buildTv({
      name: 'Severance',
      poster_path: '/sev.jpg',
      first_air_date: '2022-02-18',
      vote_average: 8.4,
    });

    expect(toTvCardData(tv)).toEqual({
      id: tv.id,
      title: 'Severance',
      imageUrl: 'https://image.tmdb.org/t/p/w342/sev.jpg',
      year: '2022',
      rating: '8.4',
      href: null,
    });
  });

  it('uses null for a missing poster and air date', () => {
    const card = toTvCardData(buildTv({ poster_path: null, first_air_date: '' }));

    expect(card.imageUrl).toBeNull();
    expect(card.year).toBeNull();
  });
});

describe('toTrendingCardData', () => {
  it('dispatches on media_type', () => {
    const movie = { ...buildMovie({ title: 'Dune' }), media_type: 'movie' as const };
    const tv = { ...buildTv({ name: 'Severance' }), media_type: 'tv' as const };

    expect(toTrendingCardData(movie)).toEqual(toMovieCardData(movie));
    expect(toTrendingCardData(tv)).toEqual(toTvCardData(tv));
  });
});

describe('card links', () => {
  it('links a movie to its details page', () => {
    expect(toMovieCardData(buildMovie({ id: 7 })).href).toBe('/movies/7');
  });
});
