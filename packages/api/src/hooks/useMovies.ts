import { useSuspenseInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query';
import { getMovieDetails, getMovies, searchMovies } from '../endpoints';
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

// Suspense-запити не підтримують `enabled`, тому пошук і список перемикаються
// всередині одного запиту — хук викликається безумовно.
export function useMoviesOrSearch(query: string, category: MovieCategory = 'popular') {
  return useSuspenseInfiniteQuery({
    queryKey: query ? queryKeys.search.movies(query) : queryKeys.movies.list(category),
    queryFn: ({ pageParam }) =>
      query ? searchMovies({ query, page: pageParam }) : getMovies(category, { page: pageParam }),
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
