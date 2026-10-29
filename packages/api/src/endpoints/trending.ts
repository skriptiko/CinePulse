import { type EndpointOptions, apiGet } from '../core';
import type { MediaType, PaginatedResponse, TimeWindow, TrendingItem } from '../types';

export type TrendingParams = {
  page?: number;
  [key: string]: string | number | boolean | undefined;
};

export async function getTrending(
  mediaType: MediaType,
  timeWindow: TimeWindow,
  params: TrendingParams = {},
  { signal }: EndpointOptions = {}
): Promise<PaginatedResponse<TrendingItem>> {
  return apiGet<PaginatedResponse<TrendingItem>>(`/trending/${mediaType}/${timeWindow}`, {
    params,
    signal,
  });
}
