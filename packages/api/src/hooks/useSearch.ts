import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { searchMovies, searchMulti, searchPerson, searchTV } from '../endpoints';
import { queryKeys } from '../queries/keys';

export function useSearchMulti(query: string) {
  return useSuspenseInfiniteQuery({
    queryKey: queryKeys.search.multi(query),
    queryFn: ({ pageParam }) => searchMulti({ query, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
  });
}

export function useSearchMovies(query: string) {
  return useSuspenseInfiniteQuery({
    queryKey: queryKeys.search.movies(query),
    queryFn: ({ pageParam }) => searchMovies({ query, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
  });
}

export function useSearchTV(query: string) {
  return useSuspenseInfiniteQuery({
    queryKey: queryKeys.search.tv(query),
    queryFn: ({ pageParam }) => searchTV({ query, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
  });
}

export function useSearchPerson(query: string) {
  return useSuspenseInfiniteQuery({
    queryKey: queryKeys.search.person(query),
    queryFn: ({ pageParam }) => searchPerson({ query, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
  });
}
