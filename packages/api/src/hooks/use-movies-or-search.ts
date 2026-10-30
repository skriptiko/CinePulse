import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageParam } from '../core';
import { type MovieCategory, getMovies, searchMovies } from '../endpoints';
import { movieQueries, searchQueries } from '../queries';

/**
 * Suspense queries do not support `enabled`, so search and the category list share one
 * call: the hook always runs and only the key and `queryFn` switch. The keys come from the
 * factories, so this query shares the cache with `movieQueries.list` / `searchQueries.movies`.
 */
export function useMoviesOrSearch(query: string, category: MovieCategory = 'popular') {
  return useSuspenseInfiniteQuery({
    queryKey: query ? searchQueries.movies(query).queryKey : movieQueries.list(category).queryKey,
    queryFn: ({ pageParam, signal }) =>
      query
        ? searchMovies({ query, page: pageParam }, { signal })
        : getMovies(category, { page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam,
  });
}
