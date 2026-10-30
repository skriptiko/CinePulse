import type { TV } from '@repo/api';

let nextId = 1;

/** A valid TMDB TV show DTO; pass only the fields the test cares about. */
export function buildTv(overrides: Partial<TV> = {}): TV {
  const id = nextId++;

  return {
    id,
    name: `Show ${id}`,
    original_name: `Show ${id}`,
    overview: 'An overview.',
    poster_path: `/tv-poster-${id}.jpg`,
    backdrop_path: `/tv-backdrop-${id}.jpg`,
    first_air_date: '2023-09-15',
    vote_average: 8.1,
    vote_count: 100,
    popularity: 10,
    adult: false,
    genre_ids: [18],
    original_language: 'en',
    origin_country: ['US'],
    ...overrides,
  };
}
