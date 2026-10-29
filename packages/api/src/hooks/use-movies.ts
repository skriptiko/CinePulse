import { useSuspenseInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query';
import { getNextPageParam } from '../core';
import { getMovieDetails, getMovies, searchMovies } from '../endpoints';
import type { MovieCategory } from '../endpoints';
import { queryKeys } from '../queries/keys';

export function useMovies(category: MovieCategory) {
  return useSuspenseInfiniteQuery({
    queryKey: queryKeys.movies.list(category),
    queryFn: ({ pageParam, signal }) => getMovies(category, { page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam,
  });
}

// Suspense-запити не підтримують `enabled`, тому пошук і список перемикаються
// всередині одного запиту — хук викликається безумовно.
export function useMoviesOrSearch(query: string, category: MovieCategory = 'popular') {
  return useSuspenseInfiniteQuery({
    queryKey: query ? queryKeys.search.movies(query) : queryKeys.movies.list(category),
    queryFn: ({ pageParam, signal }) =>
      query
        ? searchMovies({ query, page: pageParam }, { signal })
        : getMovies(category, { page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam,
  });
}

export function useMovieDetails(id: number) {
  return useSuspenseQuery({
    queryKey: queryKeys.movies.detail(id),
    queryFn: ({ signal }) => getMovieDetails(id, { signal }),
  });
}
