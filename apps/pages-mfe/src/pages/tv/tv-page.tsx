import { type DiscoverTVSortBy, genreQueries, useTVOrSearch } from '@repo/api';
import { toTvCardData, usePageMeta } from '@repo/ui';
import { usePrefetchQuery } from '@tanstack/react-query';
import { CatalogView } from '../../components/catalog/catalog-view';
import { type SortOption, useCatalogFilters } from '../../components/catalog/use-catalog-filters';

const LABELS = { title: 'TV Shows', singular: 'TV show', plural: 'TV shows' };

const SORT_BY: Record<SortOption, DiscoverTVSortBy> = {
  popular: 'popularity.desc',
  newest: 'first_air_date.desc',
  rating: 'vote_average.desc',
};

export function TVShows() {
  usePageMeta(LABELS.title);

  // Starts the genre request next to the shows one, before `CatalogFilters` suspends on it.
  usePrefetchQuery(genreQueries.tv());

  const catalog = useCatalogFilters();
  const { query, genreId, sort } = catalog.deferredFilters;
  const results = useTVOrSearch(query, { genreId, sortBy: SORT_BY[sort] });

  return (
    <CatalogView
      labels={LABELS}
      genresQuery={genreQueries.tv()}
      catalog={catalog}
      results={results}
      toCard={toTvCardData}
    />
  );
}
