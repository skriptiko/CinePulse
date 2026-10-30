import { buildMovie } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { toFeaturedItemData } from '../featured-item';

const GENRES = [
  { id: 28, name: 'Action' },
  { id: 878, name: 'Science Fiction' },
];

describe('toFeaturedItemData', () => {
  it('maps a movie to a tile with a w780 backdrop and its first genre', () => {
    const movie = buildMovie({
      title: 'Dune',
      backdrop_path: '/dune-bg.jpg',
      release_date: '2021-09-15',
      vote_average: 7.84,
      genre_ids: [878, 28],
    });

    expect(toFeaturedItemData(movie, GENRES)).toEqual({
      id: movie.id,
      title: 'Dune',
      imageUrl: 'https://image.tmdb.org/t/p/w780/dune-bg.jpg',
      year: '2021',
      rating: '7.8',
      genre: 'Science Fiction',
      href: `/movies/${movie.id}`,
    });
  });

  it('skips genre ids missing from the list', () => {
    const movie = buildMovie({ genre_ids: [99999, 28] });

    expect(toFeaturedItemData(movie, GENRES).genre).toBe('Action');
  });

  it('uses null when no genre or backdrop is known', () => {
    const item = toFeaturedItemData(buildMovie({ genre_ids: [], backdrop_path: null }), GENRES);

    expect(item.genre).toBeNull();
    expect(item.imageUrl).toBeNull();
  });
});
