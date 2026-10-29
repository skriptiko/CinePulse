import { useSuspenseInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query';
import { getNextPageParam } from '../core';
import { getTVDetails, getTVShows } from '../endpoints';
import type { TVCategory } from '../endpoints';
import { queryKeys } from '../queries/keys';

export function useTVShows(category: TVCategory) {
  return useSuspenseInfiniteQuery({
    queryKey: queryKeys.tv.list(category),
    queryFn: ({ pageParam, signal }) => getTVShows(category, { page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam,
  });
}

export function useTVDetails(id: number) {
  return useSuspenseQuery({
    queryKey: queryKeys.tv.detail(id),
    queryFn: ({ signal }) => getTVDetails(id, { signal }),
  });
}
