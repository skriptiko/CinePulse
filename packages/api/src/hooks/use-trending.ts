import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageParam } from '../core';
import { getTrending } from '../endpoints';
import { queryKeys } from '../queries/keys';
import type { MediaType, TimeWindow } from '../types';

export function useTrending(mediaType: MediaType = 'all', timeWindow: TimeWindow = 'day') {
  return useSuspenseInfiniteQuery({
    queryKey: queryKeys.trending.byType(mediaType, timeWindow),
    queryFn: ({ pageParam, signal }) =>
      getTrending(mediaType, timeWindow, { page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam,
  });
}
