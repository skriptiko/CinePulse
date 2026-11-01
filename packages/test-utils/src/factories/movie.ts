import type { Movie, MovieDetails, PaginatedResponse } from '@repo/api';

let nextId = 1;

/** A valid TMDB movie DTO; pass only the fields the test cares about. */
export function buildMovie(overrides: Partial<Movie> = {}): Movie {
  const id = nextId++;

  return {
    id,
    title: `Movie ${id}`,
    original_title: `Movie ${id}`,
    overview: 'An overview.',
    poster_path: `/poster-${id}.jpg`,
    backdrop_path: `/backdrop-${id}.jpg`,
    release_date: '2024-01-01',
    vote_average: 7.5,
    vote_count: 100,
    popularity: 10,
    adult: false,
    genre_ids: [28],
    original_language: 'en',
    video: false,
    ...overrides,
  };
}

/** A valid `/movie/{id}` response with every section empty; pass only what the test shows. */
export function buildMovieDetails(overrides: Partial<MovieDetails> = {}): MovieDetails {
  const { genre_ids: _genreIds, ...movie } = buildMovie();

  return {
    ...movie,
    genres: [],
    budget: 0,
    revenue: 0,
    runtime: null,
    status: 'Released',
    tagline: null,
    homepage: null,
    imdb_id: null,
    production_companies: [],
    production_countries: [],
    spoken_languages: [],
    belongs_to_collection: null,
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

/** A single-page TMDB list response around `results`. */
export function buildPaginated<T>(
  results: T[],
  overrides: Partial<PaginatedResponse<T>> = {}
): PaginatedResponse<T> {
  return { page: 1, results, total_pages: 1, total_results: results.length, ...overrides };
}
