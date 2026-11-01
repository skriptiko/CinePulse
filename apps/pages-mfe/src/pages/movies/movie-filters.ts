import type { DiscoverSortBy } from '@repo/api';
import { ROUTE_PATHS } from '@repo/routes';
import { FILTER_PARAMS, type SortOption } from '../../components/catalog/use-catalog-filters';

/** Link to Movies filtered by one genre, e.g. from the Home genre pills. */
export function moviesHrefForGenre(genreId: number): string {
  const params = new URLSearchParams({ [FILTER_PARAMS.genre]: String(genreId) });
  return `${ROUTE_PATHS.MOVIES}?${params}`;
}

export function toDiscoverSortBy(sort: SortOption): DiscoverSortBy {
  switch (sort) {
    case 'popular':
      return 'popularity.desc';
    case 'newest':
      return 'primary_release_date.desc';
    case 'rating':
      return 'vote_average.desc';
    default: {
      const unhandled: never = sort;
      return unhandled;
    }
  }
}
