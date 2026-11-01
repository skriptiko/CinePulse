import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageParam } from '../core';
import { discoverTV, searchTV } from '../endpoints';
import { type DiscoverTVFilters, searchQueries, tvQueries } from '../queries';

/** `useMoviesOrSearch` for TV Shows: one call, and a non-empty `query` wins over `filters`. */
export function useTVOrSearch(query: string, filters: DiscoverTVFilters) {
  return useSuspenseInfiniteQuery({
    queryKey: query ? searchQueries.tv(query).queryKey : tvQueries.discover(filters).queryKey,
    queryFn: ({ pageParam, signal }) =>
      query
        ? searchTV({ query, page: pageParam }, { signal })
        : discoverTV({ ...filters, page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam,
    // Both factories set it too; the page shows a next-page failure inline.
    meta: { inlineErrors: true },
  });
}
