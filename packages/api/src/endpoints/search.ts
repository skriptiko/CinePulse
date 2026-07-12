import { apiGet } from '../core';
import type { Movie, MultiSearchResult, PaginatedResponse, Person, TV } from '../types';

export type SearchParams = {
  query: string;
  page?: number;
  [key: string]: string | number | boolean | undefined;
};

export async function searchMulti(
  params: SearchParams
): Promise<PaginatedResponse<MultiSearchResult>> {
  return apiGet<PaginatedResponse<MultiSearchResult>>('/search/multi', { params });
}

export async function searchMovies(params: SearchParams): Promise<PaginatedResponse<Movie>> {
  return apiGet<PaginatedResponse<Movie>>('/search/movie', { params });
}

export async function searchTV(params: SearchParams): Promise<PaginatedResponse<TV>> {
  return apiGet<PaginatedResponse<TV>>('/search/tv', { params });
}

export async function searchPerson(params: SearchParams): Promise<PaginatedResponse<Person>> {
  return apiGet<PaginatedResponse<Person>>('/search/person', { params });
}
