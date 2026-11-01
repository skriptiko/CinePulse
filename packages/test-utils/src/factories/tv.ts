import type { TV, TVDetails } from '@repo/api';
import { buildPaginated } from './movie';

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

/** A valid `/tv/{id}` response with every section empty; pass only what the test shows. */
export function buildTvDetails(overrides: Partial<TVDetails> = {}): TVDetails {
  const { genre_ids: _genreIds, ...tv } = buildTv();

  return {
    ...tv,
    genres: [],
    created_by: [],
    episode_run_time: [],
    homepage: null,
    in_production: false,
    languages: [],
    last_air_date: null,
    last_episode_to_air: null,
    next_episode_to_air: null,
    networks: [],
    number_of_episodes: 0,
    number_of_seasons: 0,
    production_companies: [],
    seasons: [],
    status: 'Ended',
    tagline: null,
    type: 'Scripted',
    credits: { cast: [], crew: [] },
    videos: { results: [] },
    images: { backdrops: [], posters: [], logos: [] },
    recommendations: buildPaginated([]),
    similar: buildPaginated([]),
    reviews: buildPaginated([]),
    'watch/providers': { results: {} },
    ...overrides,
  };
}
