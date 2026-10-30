import { apiGet, type EndpointOptions } from '../core';
import type { PageParams, PaginatedResponse, TV, TVDetails } from '../types';

export type TVCategory = 'popular' | 'top_rated' | 'on_the_air' | 'airing_today';

export async function getTVShows(
  category: TVCategory,
  params: PageParams = {},
  { signal }: EndpointOptions = {}
): Promise<PaginatedResponse<TV>> {
  return apiGet<PaginatedResponse<TV>>(`/tv/${category}`, { params, signal });
}

export async function getTVDetails(
  id: number,
  { signal }: EndpointOptions = {}
): Promise<TVDetails> {
  return apiGet<TVDetails>(`/tv/${id}`, { signal });
}
