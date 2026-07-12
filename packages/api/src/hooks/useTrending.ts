import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getTrending } from '../endpoints';
import { queryKeys } from '../queries/keys';
import type { MediaType, TimeWindow } from '../types';

export function useTrending(mediaType: MediaType = 'all', timeWindow: TimeWindow = 'day') {
  return useSuspenseInfiniteQuery({
    queryKey: queryKeys.trending.byType(mediaType, timeWindow),
    queryFn: ({ pageParam }) => getTrending(mediaType, timeWindow, { page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
  });
}
