import { genreQueries, useMoviesOrSearch } from '@repo/api';
import { toMovieCardData, usePageMeta } from '@repo/ui';
import { usePrefetchQuery } from '@tanstack/react-query';
import { CatalogView } from '../../components/catalog/catalog-view';
import { useCatalogFilters } from '../../components/catalog/use-catalog-filters';
import { toDiscoverSortBy } from './movie-filters';

const LABELS = { title: 'Movies', singular: 'movie', plural: 'movies' };

export function Movies() {
  usePageMeta(LABELS.title);

  // Starts the genre request next to the movies one, before `CatalogFilters` suspends on it.
  usePrefetchQuery(genreQueries.movie());

  const catalog = useCatalogFilters();
  const { query, genreId, sort } = catalog.deferredFilters;
  const results = useMoviesOrSearch(query, { genreId, sortBy: toDiscoverSortBy(sort) });

  return (
    <CatalogView
      labels={LABELS}
      genresQuery={genreQueries.movie()}
      catalog={catalog}
      results={results}
      toCard={toMovieCardData}
    />
  );
}
