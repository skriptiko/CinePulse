import { useSuspenseInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query';
import { getMovieDetails, getMovies } from '../endpoints';
import type { MovieCategory } from '../endpoints';
import { queryKeys } from '../queries/keys';

export function useMovies(category: MovieCategory) {
  return useSuspenseInfiniteQuery({
    queryKey: queryKeys.movies.list(category),
    queryFn: ({ pageParam }) => getMovies(category, { page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
  });
}

export function useMovieDetails(id: number) {
  return useSuspenseQuery({
    queryKey: queryKeys.movies.detail(id),
    queryFn: () => getMovieDetails(id),
  });
}
