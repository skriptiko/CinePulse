import { genreQueries, type Movie, useMoviesOrSearch } from '@repo/api';
import { cn, usePageMeta } from '@repo/ui';
import { usePrefetchQuery } from '@tanstack/react-query';
import { useDeferredValue, useMemo, useState } from 'react';
import { MoviesEmptyState } from './movies-empty-state';
import { MoviesFilters, type ViewMode } from './movies-filters';
import { MoviesGrid } from './movies-grid';
import { MoviesHeader } from './movies-header';
import {
  DEFAULT_SORT,
  normalizeQuery,
  toDiscoverSortBy,
  useMovieFilters,
} from './use-movie-filters';

const countFormat = new Intl.NumberFormat('en-US');

export function Movies() {
  usePageMeta('Movies');

  // Starts the genre request next to the movies one, before `MoviesFilters` suspends on it.
  usePrefetchQuery(genreQueries.movie());

  const {
    filters,
    searchInput,
    isStale,
    setSearchInput,
    clearSearch,
    setGenre,
    setSort,
    resetFilters,
  } = useMovieFilters();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // URL writes are transitions already; deferring also keeps the current results on screen
  // for a URL change that is not one (otherwise the Suspense fallback replaces the page).
  const deferredFilters = useDeferredValue(filters);
  const { query, genreId, sort } = deferredFilters;
  const isShowingStale = isStale || deferredFilters !== filters;

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, isFetchNextPageError } =
    useMoviesOrSearch(query, { genreId, sortBy: toDiscoverSortBy(sort) });

  // TMDB pages can overlap when the ranking shifts between requests; keep the first copy.
  const movies = useMemo(() => uniqueById(data.pages.flatMap((page) => page.results)), [data]);
  const totalResults = data.pages[0]?.total_results ?? 0;

  const handleLoadMore = () => {
    if (hasNextPage && !isFetching) void fetchNextPage();
  };

  return (
    <div className="pt-20 sm:pt-24">
      <MoviesHeader />

      <MoviesFilters
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        genreId={filters.genreId}
        onGenreChange={setGenre}
        sort={filters.sort}
        onSortChange={setSort}
        isSearching={normalizeQuery(searchInput) !== ''}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="px-4 py-4 sm:px-6 lg:px-12">
        <output className="text-muted-foreground block text-sm">
          {countFormat.format(totalResults)} {totalResults === 1 ? 'movie' : 'movies'} found
        </output>
      </div>

      <div
        className={cn(
          'px-4 pb-16 transition-opacity sm:px-6 lg:px-12',
          isShowingStale && 'opacity-60'
        )}
        aria-busy={isShowingStale}
      >
        {movies.length > 0 ? (
          <MoviesGrid
            movies={movies}
            viewMode={viewMode}
            hasNextPage={hasNextPage}
            isFetching={isFetching}
            isFetchingNextPage={isFetchingNextPage}
            isFetchNextPageError={isFetchNextPageError}
            onLoadMore={handleLoadMore}
          />
        ) : (
          <MoviesEmptyState
            query={query}
            hasFilters={genreId !== null || sort !== DEFAULT_SORT}
            onClearSearch={clearSearch}
            onResetFilters={resetFilters}
          />
        )}
      </div>
    </div>
  );
}

function uniqueById(movies: Movie[]): Movie[] {
  const seen = new Set<number>();
  return movies.filter((movie) => {
    if (seen.has(movie.id)) return false;
    seen.add(movie.id);
    return true;
  });
}
