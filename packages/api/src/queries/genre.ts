import { queryOptions } from '@tanstack/react-query';
import { getMovieGenres, getTVGenres } from '../endpoints';
import { STALE_TIME_REFERENCE } from './stale-time';

export const genreQueries = {
  all: () => ['genres'] as const,

  movie: () =>
    queryOptions({
      queryKey: [...genreQueries.all(), 'movie'],
      queryFn: ({ signal }) => getMovieGenres({ signal }),
      staleTime: STALE_TIME_REFERENCE,
    }),

  tv: () =>
    queryOptions({
      queryKey: [...genreQueries.all(), 'tv'],
      queryFn: ({ signal }) => getTVGenres({ signal }),
      staleTime: STALE_TIME_REFERENCE,
    }),
};
