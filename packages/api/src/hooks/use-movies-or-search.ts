import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageParam } from '../core';
import { discoverMovies, searchMovies } from '../endpoints';
import { type DiscoverMovieFilters, movieQueries, searchQueries } from '../queries';

/**
 * Suspense queries do not support `enabled`, so search and discover share one call: the hook
 * always runs and only the key and `queryFn` switch. The keys come from the factories, so
 * this query shares the cache with `searchQueries.movies` / `movieQueries.discover`.
 *
 * A non-empty `query` wins: TMDB search has no genre or sort, so `filters` are ignored then.
 */
export function useMoviesOrSearch(query: string, filters: DiscoverMovieFilters) {
  return useSuspenseInfiniteQuery({
    queryKey: query
      ? searchQueries.movies(query).queryKey
      : movieQueries.discover(filters).queryKey,
    queryFn: ({ pageParam, signal }) =>
      query
        ? searchMovies({ query, page: pageParam }, { signal })
        : discoverMovies({ ...filters, page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam,
    // Both factories set it too; the page shows a next-page failure inline.
    meta: { inlineErrors: true },
  });
}
