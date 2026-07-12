import { apiGet } from '../core';
import type { GenresResponse } from '../types';

export async function getMovieGenres(): Promise<GenresResponse> {
  return apiGet<GenresResponse>('/genre/movie/list');
}

export async function getTVGenres(): Promise<GenresResponse> {
  return apiGet<GenresResponse>('/genre/tv/list');
}
