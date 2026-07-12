import { useSuspenseInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query';
import { getTVDetails, getTVShows } from '../endpoints';
import type { TVCategory } from '../endpoints';
import { queryKeys } from '../queries/keys';

export function useTVShows(category: TVCategory) {
  return useSuspenseInfiniteQuery({
    queryKey: queryKeys.tv.list(category),
    queryFn: ({ pageParam }) => getTVShows(category, { page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
  });
}

export function useTVDetails(id: number) {
  return useSuspenseQuery({
    queryKey: queryKeys.tv.detail(id),
    queryFn: () => getTVDetails(id),
  });
}
