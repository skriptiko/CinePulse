import type { Movie } from '@repo/api';
import { Button, cn, MovieCard, toMovieCardData } from '@repo/ui';
import { Loader2 } from 'lucide-react';
import { useId } from 'react';
import type { ViewMode } from './movies-filters';

export type MoviesGridProps = {
  movies: Movie[];
  viewMode: ViewMode;
  hasNextPage: boolean;
  /** Any fetch of this query is in flight (next page or a refetch). */
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  onLoadMore: () => void;
};

export function MoviesGrid({
  movies,
  viewMode,
  hasNextPage,
  isFetching,
  isFetchingNextPage,
  isFetchNextPageError,
  onLoadMore,
}: MoviesGridProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId}>
      {/* Cards title themselves with h3; this keeps the heading outline intact. */}
      <h2 id={headingId} className="sr-only">
        Results
      </h2>
      <ul
        className={cn(
          'grid gap-3 sm:gap-4 lg:gap-6',
          viewMode === 'grid'
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
            : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8'
        )}
      >
        {movies.map((movie) => (
          <li key={movie.id}>
            <MovieCard movie={toMovieCardData(movie)} />
          </li>
        ))}
      </ul>

      <div className="mt-12 flex flex-col items-center gap-3">
        {isFetchNextPageError && !isFetchingNextPage && (
          <p role="alert" className="text-destructive text-sm">
            Couldn&apos;t load more movies.
          </p>
        )}
        {hasNextPage ? (
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isFetching}
            className="rounded-full px-8"
          >
            {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {loadMoreLabel(isFetchingNextPage, isFetchNextPageError)}
          </Button>
        ) : (
          <p className="text-muted-foreground text-sm">That&apos;s all</p>
        )}
      </div>
    </section>
  );
}

function loadMoreLabel(isFetchingNextPage: boolean, isFetchNextPageError: boolean): string {
  if (isFetchingNextPage) return 'Loading...';
  return isFetchNextPageError ? 'Try again' : 'Load more';
}
