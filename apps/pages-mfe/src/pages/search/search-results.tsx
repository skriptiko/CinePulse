import { searchQueries } from '@repo/api';
import {
  PersonCard,
  type PersonCardData,
  toMovieCardData,
  toPersonCardData,
  toTvCardData,
} from '@repo/ui';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { type ReactNode, useMemo } from 'react';
import { CatalogCount } from '../../components/catalog/catalog-count';
import { CatalogEmptyState } from '../../components/catalog/catalog-empty-state';
import { CatalogGrid, renderTitleCard } from '../../components/catalog/catalog-grid';
import type { CatalogResults } from '../../components/catalog/catalog-view';
import { uniqueById } from '../../lib/unique-by-id';
import { SEARCH_LABELS, type SearchLabels, type SearchType } from './use-search-state';

const PERSON_SEARCH_HINT = 'Check the spelling or try a different name.';

type TabResultsProps = {
  query: string;
  onClear: () => void;
};

export type SearchResultsProps = TabResultsProps & {
  type: SearchType;
};

/** Each tab is a component of its own: a Suspense query cannot be picked by a condition. */
export function SearchResults({ type, query, onClear }: SearchResultsProps) {
  switch (type) {
    case 'movie':
      return <MovieResults query={query} onClear={onClear} />;
    case 'tv':
      return <TvResults query={query} onClear={onClear} />;
    case 'person':
      return <PersonResults query={query} onClear={onClear} />;
    default: {
      const unhandled: never = type;
      return unhandled;
    }
  }
}

function MovieResults({ query, onClear }: TabResultsProps) {
  const results = useSuspenseInfiniteQuery(searchQueries.movies(query));

  return (
    <ResultList
      labels={SEARCH_LABELS.movie}
      query={query}
      results={results}
      toItem={toMovieCardData}
      renderItem={renderTitleCard}
      onClear={onClear}
    />
  );
}

function TvResults({ query, onClear }: TabResultsProps) {
  const results = useSuspenseInfiniteQuery(searchQueries.tv(query));

  return (
    <ResultList
      labels={SEARCH_LABELS.tv}
      query={query}
      results={results}
      toItem={toTvCardData}
      renderItem={renderTitleCard}
      onClear={onClear}
    />
  );
}

function PersonResults({ query, onClear }: TabResultsProps) {
  const results = useSuspenseInfiniteQuery(searchQueries.person(query));

  return (
    <ResultList
      labels={SEARCH_LABELS.person}
      query={query}
      results={results}
      toItem={toPersonCardData}
      renderItem={renderPersonCard}
      searchHint={PERSON_SEARCH_HINT}
      onClear={onClear}
    />
  );
}

function renderPersonCard(person: PersonCardData) {
  return <PersonCard person={person} />;
}

type ResultListProps<T, Item> = TabResultsProps & {
  labels: SearchLabels;
  results: CatalogResults<T>;
  /** Stable, as it is a dependency of the memo. */
  toItem: (result: T) => Item;
  renderItem: (item: Item) => ReactNode;
  searchHint?: string;
};

function ResultList<T extends { id: number }, Item extends { id: number }>({
  labels,
  query,
  results,
  toItem,
  renderItem,
  searchHint,
  onClear,
}: ResultListProps<T, Item>) {
  const { data, fetchNextPage, hasNextPage, isFetching } = results;

  const items = useMemo(
    () => uniqueById(data.pages.flatMap((page) => page.results)).map(toItem),
    [data, toItem]
  );

  const handleLoadMore = () => {
    if (hasNextPage && !isFetching) void fetchNextPage();
  };

  return (
    <>
      <div className="mb-4">
        <CatalogCount
          total={data.pages[0]?.total_results ?? 0}
          singular={labels.singular}
          plural={labels.plural}
        />
      </div>

      {items.length > 0 ? (
        <CatalogGrid
          noun={labels.plural}
          items={items}
          renderItem={renderItem}
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
          searchHint={searchHint}
          onClearSearch={onClear}
        />
      )}
    </>
  );
}
