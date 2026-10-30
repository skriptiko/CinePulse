import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { getNextPageParam } from '../core';
import { type MovieCategory, getMovieDetails, getMovies } from '../endpoints';

export const movieQueries = {
  all: () => ['movies'] as const,
  lists: () => [...movieQueries.all(), 'list'] as const,
  details: () => [...movieQueries.all(), 'detail'] as const,

  /** Every page of a category, for "Load more". */
  list: (category: MovieCategory) =>
    infiniteQueryOptions({
      queryKey: [...movieQueries.lists(), category],
      queryFn: ({ pageParam, signal }) => getMovies(category, { page: pageParam }, { signal }),
      initialPageParam: 1,
      getNextPageParam,
    }),

  /** The first page only, for a content row. */
  row: (category: MovieCategory) =>
    queryOptions({
      queryKey: [...movieQueries.lists(), category, 'first-page'],
      queryFn: ({ signal }) => getMovies(category, { page: 1 }, { signal }),
    }),

  detail: (id: number) =>
    queryOptions({
      queryKey: [...movieQueries.details(), id],
      queryFn: ({ signal }) => getMovieDetails(id, { signal }),
    }),
};
