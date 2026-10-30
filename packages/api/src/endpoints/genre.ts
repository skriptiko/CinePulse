import { type EndpointOptions, apiGet } from '../core';
import type { GenresResponse } from '../types';

export async function getMovieGenres({ signal }: EndpointOptions = {}): Promise<GenresResponse> {
  return apiGet<GenresResponse>('/genre/movie/list', { signal });
}

export async function getTVGenres({ signal }: EndpointOptions = {}): Promise<GenresResponse> {
  return apiGet<GenresResponse>('/genre/tv/list', { signal });
}
