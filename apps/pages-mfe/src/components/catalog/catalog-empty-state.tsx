import { Button } from '@repo/ui';
import { Search } from 'lucide-react';

export type CatalogEmptyStateProps = {
  /** Plural noun of the page, e.g. `movies`. */
  noun: string;
  /** The active search text; `''` when browsing by genre and sort. */
  query: string;
  /** A genre or a non-default sort is set. */
  hasFilters?: boolean;
  /** The line under the heading while searching. */
  searchHint?: string;
  onClearSearch: () => void;
  /** Left out where the page has no filters. */
  onResetFilters?: () => void;
};

export function CatalogEmptyState({
  noun,
  query,
  hasFilters = false,
  searchHint = 'Check the spelling or try a different title.',
  onClearSearch,
  onResetFilters,
}: CatalogEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="bg-secondary mb-4 flex size-16 items-center justify-center rounded-full">
        <Search className="text-muted-foreground size-8" aria-hidden="true" />
      </div>
      <h2 className="mb-2 max-w-full text-lg font-medium break-words">
        {query ? `No ${noun} found for “${query}”` : `No ${noun} found`}
      </h2>
      <p className="text-muted-foreground max-w-md text-sm">
        {query ? searchHint : 'Try a different genre or reset the filters.'}
      </p>
      <div className="mt-4 flex gap-2">
        {query && (
          <Button variant="secondary" className="rounded-lg" onClick={onClearSearch}>
            Clear search
          </Button>
        )}
        {onResetFilters && (hasFilters || query) && (
          <Button variant="secondary" className="rounded-lg" onClick={onResetFilters}>
            Reset filters
          </Button>
        )}
      </div>
    </div>
  );
}
