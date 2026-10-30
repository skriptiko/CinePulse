import { type EndpointOptions, apiGet } from '../core';
import type { Movie, MovieDetails, PageParams, PaginatedResponse } from '../types';

export type MovieCategory = 'popular' | 'top_rated' | 'upcoming' | 'now_playing';

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
