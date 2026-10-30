import { apiGet, type EndpointOptions } from '../core';
import type { Movie, MovieDetails, PageParams, PaginatedResponse } from '../types';

export type MovieCategory = 'popular' | 'top_rated' | 'upcoming' | 'now_playing';

/** `sort_by` values the app sends to `/discover/movie` (the proxy allows only these). */
export type DiscoverSortBy = 'popularity.desc' | 'primary_release_date.desc' | 'vote_average.desc';

export type DiscoverMovieParams = PageParams & {
  /** TMDB genre id; `null` or omitted means every genre. */
  genreId?: number | null;
  sortBy: DiscoverSortBy;
};

/** Without a vote floor, a "top rated" list starts with 10/10 films rated by one person. */
export const DISCOVER_MIN_VOTE_COUNT = 200;

export async function getMovies(
  category: MovieCategory,
  params: PageParams = {},
  { signal }: EndpointOptions = {}
): Promise<PaginatedResponse<Movie>> {
  return apiGet<PaginatedResponse<Movie>>(`/movie/${category}`, { params, signal });
}

export async function getMovieDetails(
  id: number,
  { signal }: EndpointOptions = {}
): Promise<MovieDetails> {
  return apiGet<MovieDetails>(`/movie/${id}`, { signal });
}

/**
 * `GET /discover/movie`: server-side genre filter and sort. Extra params keep two sorts
 * useful: a vote floor for rating, and "released by today" for newest (otherwise the list
 * starts with announced films that have no poster or votes).
 */
export async function discoverMovies(
  { genreId, sortBy, page }: DiscoverMovieParams,
  { signal }: EndpointOptions = {}
): Promise<PaginatedResponse<Movie>> {
  return apiGet<PaginatedResponse<Movie>>('/discover/movie', {
    params: {
      page,
      with_genres: genreId ?? undefined,
      sort_by: sortBy,
      'vote_count.gte': sortBy === 'vote_average.desc' ? DISCOVER_MIN_VOTE_COUNT : undefined,
      'primary_release_date.lte':
        sortBy === 'primary_release_date.desc' ? toIsoDate(new Date()) : undefined,
    },
    signal,
  });
}

/** `YYYY-MM-DD` in UTC, the format TMDB date filters take. */
function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
