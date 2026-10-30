import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { getNextPageParam } from '../core';
import { getTrending } from '../endpoints';
import type { MediaType, TimeWindow } from '../types';

/** Query options for trending lists, mixed by `media_type`. */
export const trendingQueries = {
  all: () => ['trending'] as const,
  lists: () => [...trendingQueries.all(), 'list'] as const,

  list: (mediaType: MediaType, timeWindow: TimeWindow) =>
    infiniteQueryOptions({
      queryKey: [...trendingQueries.lists(), mediaType, timeWindow],
      queryFn: ({ pageParam, signal }) =>
        getTrending(mediaType, timeWindow, { page: pageParam }, { signal }),
      initialPageParam: 1,
      getNextPageParam,
    }),

  row: (mediaType: MediaType, timeWindow: TimeWindow) =>
    queryOptions({
      queryKey: [...trendingQueries.lists(), mediaType, timeWindow, 'first-page'],
      queryFn: ({ signal }) => getTrending(mediaType, timeWindow, { page: 1 }, { signal }),
    }),
};
