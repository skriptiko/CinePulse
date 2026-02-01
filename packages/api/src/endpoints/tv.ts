import { apiGet } from '../core';
import type { PaginatedResponse, TV, TVDetails } from '../types';

export type TVCategory = 'popular' | 'top_rated' | 'on_the_air' | 'airing_today';

export type TVListParams = {
  page?: number;
  [key: string]: string | number | boolean | undefined;
};

export async function getTVShows(
  category: TVCategory,
  params: TVListParams = {}
): Promise<PaginatedResponse<TV>> {
  return apiGet<PaginatedResponse<TV>>(`/tv/${category}`, { params });
}

export async function getTVDetails(id: number): Promise<TVDetails> {
  return apiGet<TVDetails>(`/tv/${id}`);
}
