import { useSuspenseQuery } from '@tanstack/react-query';
import { getMovieGenres, getTVGenres } from '../endpoints';
import { queryKeys } from '../queries/keys';

export function useMovieGenres() {
  return useSuspenseQuery({
    queryKey: queryKeys.genres.movies(),
    queryFn: ({ signal }) => getMovieGenres({ signal }),
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export function useTVGenres() {
  return useSuspenseQuery({
    queryKey: queryKeys.genres.tv(),
    queryFn: ({ signal }) => getTVGenres({ signal }),
    staleTime: 1000 * 60 * 60 * 24,
  });
}
