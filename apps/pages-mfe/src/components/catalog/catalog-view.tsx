import type { genreQueries, PaginatedResponse } from '@repo/api';
import { cn, type MovieCardData } from '@repo/ui';
import type { InfiniteData, UseSuspenseInfiniteQueryResult } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { uniqueById } from '../../lib/unique-by-id';
import { CatalogCount } from './catalog-count';
import { CatalogEmptyState } from './catalog-empty-state';
import { CatalogFilters, type ViewMode } from './catalog-filters';
import { CatalogGrid, renderTitleCard } from './catalog-grid';
import { CatalogHeader } from './catalog-header';
import { type CatalogFiltersState, DEFAULT_SORT, normalizeQuery } from './use-catalog-filters';

export type CatalogLabels = {
  title: string;
  /** `1 movie found`. */
  singular: string;
  /** `4 movies found`, `Search movies`. */
  plural: string;
};

export type CatalogResults<T> = Pick<
  UseSuspenseInfiniteQueryResult<InfiniteData<PaginatedResponse<T>>>,
  | 'data'
  | 'fetchNextPage'
  | 'hasNextPage'
  | 'isFetching'
  | 'isFetchingNextPage'
  | 'isFetchNextPageError'
>;

export type CatalogViewProps<T> = {
  labels: CatalogLabels;
  /** `genreQueries.movie()` or `genreQueries.tv()`. */
  genresQuery: ReturnType<typeof genreQueries.movie>;
  catalog: CatalogFiltersState;
  results: CatalogResults<T>;
  toCard: (item: T) => MovieCardData;
};

/**
 * Everything Movies and TV Shows have in common. The pages stay separate components, so moving
 * between them remounts this and leaves no search text or card size behind.
 */
export function CatalogView<T extends { id: number }>({
  labels,
  genresQuery,
  catalog,
  results,
  toCard,
}: CatalogViewProps<T>) {
  const { filters, deferredFilters, searchInput, isStale } = catalog;
  const { data, fetchNextPage, hasNextPage, isFetching } = results;
  const { query, genreId, sort } = deferredFilters;
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const cards = useMemo(
    () => uniqueById(data.pages.flatMap((page) => page.results)).map(toCard),
    [data, toCard]
  );
  const totalResults = data.pages[0]?.total_results ?? 0;

  const handleLoadMore = () => {
    if (hasNextPage && !isFetching) void fetchNextPage();
  };

  return (
    <div className="pt-20 sm:pt-24">
      <CatalogHeader title={labels.title} noun={labels.plural} />

      <CatalogFilters
        noun={labels.plural}
        genresQuery={genresQuery}
        searchInput={searchInput}
        onSearchChange={catalog.setSearchInput}
        genreId={filters.genreId}
        onGenreChange={catalog.setGenre}
        sort={filters.sort}
        onSortChange={catalog.setSort}
        isSearching={normalizeQuery(searchInput) !== ''}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="px-4 py-4 sm:px-6 lg:px-12">
        <CatalogCount total={totalResults} singular={labels.singular} plural={labels.plural} />
      </div>

      <div
        className={cn('px-4 pb-16 transition-opacity sm:px-6 lg:px-12', isStale && 'opacity-60')}
        aria-busy={isStale}
      >
        {cards.length > 0 ? (
          <CatalogGrid
            noun={labels.plural}
            items={cards}
            renderItem={renderTitleCard}
            viewMode={viewMode}
            hasNextPage={hasNextPage}
            isFetching={isFetching}
            isFetchingNextPage={results.isFetchingNextPage}
            isFetchNextPageError={results.isFetchNextPageError}
            onLoadMore={handleLoadMore}
          />
        ) : (
          <CatalogEmptyState
            noun={labels.plural}
            query={query}
            hasFilters={genreId !== null || sort !== DEFAULT_SORT}
            onClearSearch={catalog.clearSearch}
            onResetFilters={catalog.resetFilters}
          />
        )}
      </div>
    </div>
  );
}
