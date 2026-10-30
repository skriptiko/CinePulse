import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { getNextPageParam } from '../core';
import { getTVDetails, getTVShows, type TVCategory } from '../endpoints';

export const tvQueries = {
  all: () => ['tv'] as const,
  lists: () => [...tvQueries.all(), 'list'] as const,
  details: () => [...tvQueries.all(), 'detail'] as const,

  list: (category: TVCategory) =>
    infiniteQueryOptions({
      queryKey: [...tvQueries.lists(), category],
      queryFn: ({ pageParam, signal }) => getTVShows(category, { page: pageParam }, { signal }),
      initialPageParam: 1,
      getNextPageParam,
    }),

  row: (category: TVCategory) =>
    queryOptions({
      queryKey: [...tvQueries.lists(), category, 'first-page'],
      queryFn: ({ signal }) => getTVShows(category, { page: 1 }, { signal }),
    }),

  detail: (id: number) =>
    queryOptions({
      queryKey: [...tvQueries.details(), id],
      queryFn: ({ signal }) => getTVDetails(id, { signal }),
    }),
};
