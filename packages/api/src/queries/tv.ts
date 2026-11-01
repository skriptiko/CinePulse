import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { getNextPageParam } from '../core';
import {
  type DiscoverTVSortBy,
  discoverTV,
  getTVDetails,
  getTVShows,
  type TVCategory,
} from '../endpoints';

export type DiscoverTVFilters = {
  genreId: number | null;
  sortBy: DiscoverTVSortBy;
};

/** What TV Shows shows with no filters: also what the header prefetches on intent. */
export const DEFAULT_DISCOVER_TV_FILTERS: DiscoverTVFilters = {
  genreId: null,
  sortBy: 'popularity.desc',
};

/** Query options for TV shows. Render with `useSuspenseQuery` or `useSuspenseInfiniteQuery`. */
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

  /**
   * Every page of `/discover/tv` for one genre + sort, for "Load more". A next-page failure
   * is shown inline by the page, so it never becomes a toast.
   */
  discover: ({ genreId, sortBy }: DiscoverTVFilters) =>
    infiniteQueryOptions({
      queryKey: [...tvQueries.lists(), 'discover', { genreId, sortBy }],
      queryFn: ({ pageParam, signal }) =>
        discoverTV({ genreId, sortBy, page: pageParam }, { signal }),
      initialPageParam: 1,
      getNextPageParam,
      meta: { inlineErrors: true },
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
