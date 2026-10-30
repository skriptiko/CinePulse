import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { getNextPageParam } from '../core';
import {
  type DiscoverSortBy,
  discoverMovies,
  getMovieDetails,
  getMovies,
  type MovieCategory,
} from '../endpoints';

export type DiscoverMovieFilters = {
  genreId: number | null;
  sortBy: DiscoverSortBy;
};

/** What Movies shows with no filters: also what the header prefetches on intent. */
export const DEFAULT_DISCOVER_FILTERS: DiscoverMovieFilters = {
  genreId: null,
  sortBy: 'popularity.desc',
};

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

  /**
   * Every page of `/discover/movie` for one genre + sort, for "Load more". A next-page
   * failure is shown inline by the page, so it never becomes a toast.
   */
  discover: ({ genreId, sortBy }: DiscoverMovieFilters) =>
    infiniteQueryOptions({
      queryKey: [...movieQueries.lists(), 'discover', { genreId, sortBy }],
      queryFn: ({ pageParam, signal }) =>
        discoverMovies({ genreId, sortBy, page: pageParam }, { signal }),
      initialPageParam: 1,
      getNextPageParam,
      meta: { inlineErrors: true },
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
