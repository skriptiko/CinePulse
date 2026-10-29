import { type EndpointOptions, apiGet } from '../core';
import type { Movie, MultiSearchResult, PaginatedResponse, Person, TV } from '../types';

export type SearchParams = {
  query: string;
  page?: number;
  [key: string]: string | number | boolean | undefined;
};

export async function searchMulti(
  params: SearchParams,
  { signal }: EndpointOptions = {}
): Promise<PaginatedResponse<MultiSearchResult>> {
  return apiGet<PaginatedResponse<MultiSearchResult>>('/search/multi', { params, signal });
}

export async function searchMovies(
  params: SearchParams,
  { signal }: EndpointOptions = {}
): Promise<PaginatedResponse<Movie>> {
  return apiGet<PaginatedResponse<Movie>>('/search/movie', { params, signal });
}

export async function searchTV(
  params: SearchParams,
  { signal }: EndpointOptions = {}
): Promise<PaginatedResponse<TV>> {
  return apiGet<PaginatedResponse<TV>>('/search/tv', { params, signal });
}

export async function searchPerson(
  params: SearchParams,
  { signal }: EndpointOptions = {}
): Promise<PaginatedResponse<Person>> {
  return apiGet<PaginatedResponse<Person>>('/search/person', { params, signal });
}
