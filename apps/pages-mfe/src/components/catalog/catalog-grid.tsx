import { Button, cn, MovieCard, type MovieCardData } from '@repo/ui';
import { Loader2 } from 'lucide-react';
import { type ReactNode, useId } from 'react';
import { renderAddToWatchlist } from '../add-to-watchlist';
import type { ViewMode } from './catalog-filters';

export type CatalogGridProps<T> = {
  /** Plural noun of the page, e.g. `movies`. */
  noun: string;
  items: T[];
  /** One card; `renderTitleCard` for movies and shows. */
  renderItem: (item: T) => ReactNode;
  viewMode?: ViewMode;
  hasNextPage: boolean;
  /** Any fetch of this query is in flight (next page or a refetch). */
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  onLoadMore: () => void;
};

/** A movie or a show in the grid, with its watchlist button. */
export function renderTitleCard(card: MovieCardData) {
  return <MovieCard movie={card} action={renderAddToWatchlist(card)} />;
}

export function CatalogGrid<T extends { id: number }>({
  noun,
  items,
  renderItem,
  viewMode = 'grid',
  hasNextPage,
  isFetching,
  isFetchingNextPage,
  isFetchNextPageError,
  onLoadMore,
}: CatalogGridProps<T>) {
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
          // The sticky filters reach below `scroll-padding-top`; 52 clears them on every width.
          '[&_a]:scroll-mt-52 [&_button]:scroll-mt-52',
          viewMode === 'grid'
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
            : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8'
        )}
      >
        {items.map((item) => (
          <li key={item.id}>{renderItem(item)}</li>
        ))}
      </ul>

      <div className="mt-12 flex flex-col items-center gap-3">
        {isFetchNextPageError && !isFetchingNextPage && (
          <p role="alert" className="text-destructive text-sm">
            Couldn&apos;t load more {noun}.
          </p>
        )}
        {hasNextPage ? (
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isFetching}
            className="rounded-full px-8"
          >
            {isFetchingNextPage && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
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
