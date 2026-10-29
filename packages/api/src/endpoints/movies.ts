import { type EndpointOptions, apiGet } from '../core';
import type { Movie, MovieDetails, PaginatedResponse } from '../types';

export type MovieCategory = 'popular' | 'top_rated' | 'upcoming' | 'now_playing';

export type MovieListParams = {
  page?: number;
  [key: string]: string | number | boolean | undefined;
};

export async function getMovies(
  category: MovieCategory,
  params: MovieListParams = {},
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
