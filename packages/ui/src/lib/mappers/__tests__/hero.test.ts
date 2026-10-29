import { buildMovie } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { toHeroData } from '../hero';

describe('toHeroData', () => {
  it('maps a movie to the hero with a w1280 backdrop', () => {
    const movie = buildMovie({
      title: 'Dune',
      overview: 'A desert planet.',
      backdrop_path: '/dune-bg.jpg',
      release_date: '2021-09-15',
      vote_average: 7.84,
    });

    expect(toHeroData(movie)).toEqual({
      id: movie.id,
      title: 'Dune',
      description: 'A desert planet.',
      imageUrl: 'https://image.tmdb.org/t/p/w1280/dune-bg.jpg',
      year: '2021',
      rating: '7.8',
    });
  });

  it('uses null for a missing backdrop, overview and release date', () => {
    const hero = toHeroData(buildMovie({ backdrop_path: null, overview: '', release_date: '' }));

    expect(hero.imageUrl).toBeNull();
    expect(hero.description).toBeNull();
    expect(hero.year).toBeNull();
  });

  it('keeps a rating of 0', () => {
    expect(toHeroData(buildMovie({ vote_average: 0 })).rating).toBe('0.0');
  });
});
