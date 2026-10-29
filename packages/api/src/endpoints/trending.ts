import { type EndpointOptions, apiGet } from '../core';
import type { MediaType, PageParams, PaginatedResponse, TimeWindow, TrendingItem } from '../types';

export async function getTrending(
  mediaType: MediaType,
  timeWindow: TimeWindow,
  params: PageParams = {},
  { signal }: EndpointOptions = {}
): Promise<PaginatedResponse<TrendingItem>> {
  return apiGet<PaginatedResponse<TrendingItem>>(`/trending/${mediaType}/${timeWindow}`, {
    params,
    signal,
  });
}
