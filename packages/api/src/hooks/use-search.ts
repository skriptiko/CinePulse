import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageParam } from '../core';
import { searchMovies, searchMulti, searchPerson, searchTV } from '../endpoints';
import { queryKeys } from '../queries/keys';

export function useSearchMulti(query: string) {
  return useSuspenseInfiniteQuery({
    queryKey: queryKeys.search.multi(query),
    queryFn: ({ pageParam, signal }) => searchMulti({ query, page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam,
  });
}

export function useSearchMovies(query: string) {
  return useSuspenseInfiniteQuery({
    queryKey: queryKeys.search.movies(query),
    queryFn: ({ pageParam, signal }) => searchMovies({ query, page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam,
  });
}

export function useSearchTV(query: string) {
  return useSuspenseInfiniteQuery({
    queryKey: queryKeys.search.tv(query),
    queryFn: ({ pageParam, signal }) => searchTV({ query, page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam,
  });
}

export function useSearchPerson(query: string) {
  return useSuspenseInfiniteQuery({
    queryKey: queryKeys.search.person(query),
    queryFn: ({ pageParam, signal }) => searchPerson({ query, page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam,
  });
}
