import { infiniteQueryOptions } from '@tanstack/react-query';
import { getNextPageParam } from '../core';
import { searchMovies, searchMulti, searchPerson, searchTV } from '../endpoints';

/** Query options for TMDB search. Share keys with `useMoviesOrSearch`. */
export const searchQueries = {
  all: () => ['search'] as const,

  multi: (query: string) =>
    infiniteQueryOptions({
      queryKey: [...searchQueries.all(), 'multi', query],
      queryFn: ({ pageParam, signal }) => searchMulti({ query, page: pageParam }, { signal }),
      initialPageParam: 1,
      getNextPageParam,
    }),

  movies: (query: string) =>
    infiniteQueryOptions({
      queryKey: [...searchQueries.all(), 'movies', query],
      queryFn: ({ pageParam, signal }) => searchMovies({ query, page: pageParam }, { signal }),
      initialPageParam: 1,
      getNextPageParam,
      // The Movies page shows a next-page failure inline.
      meta: { inlineErrors: true },
    }),

  tv: (query: string) =>
    infiniteQueryOptions({
      queryKey: [...searchQueries.all(), 'tv', query],
      queryFn: ({ pageParam, signal }) => searchTV({ query, page: pageParam }, { signal }),
      initialPageParam: 1,
      getNextPageParam,
    }),

  person: (query: string) =>
    infiniteQueryOptions({
      queryKey: [...searchQueries.all(), 'person', query],
      queryFn: ({ pageParam, signal }) => searchPerson({ query, page: pageParam }, { signal }),
      initialPageParam: 1,
      getNextPageParam,
    }),
};
