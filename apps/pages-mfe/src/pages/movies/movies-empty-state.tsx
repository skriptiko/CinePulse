import { Button } from '@repo/ui';
import { Search } from 'lucide-react';

export type MoviesEmptyStateProps = {
  /** The active search text; `''` when browsing by genre and sort. */
  query: string;
  /** A genre or a non-default sort is set. */
  hasFilters: boolean;
  onClearSearch: () => void;
  onResetFilters: () => void;
};

export function MoviesEmptyState({
  query,
  hasFilters,
  onClearSearch,
  onResetFilters,
}: MoviesEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="bg-secondary mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        <Search className="text-muted-foreground h-8 w-8" aria-hidden="true" />
      </div>
      <h2 className="mb-2 text-lg font-medium">
        {query ? `No movies found for “${query}”` : 'No movies found'}
      </h2>
      <p className="text-muted-foreground max-w-md text-sm">
        {query
          ? 'Check the spelling or try a different title.'
          : 'Try a different genre or reset the filters.'}
      </p>
      <div className="mt-4 flex gap-2">
        {query && (
          <Button variant="secondary" className="rounded-lg" onClick={onClearSearch}>
            Clear search
          </Button>
        )}
        {(hasFilters || query) && (
          <Button variant="secondary" className="rounded-lg" onClick={onResetFilters}>
            Reset filters
          </Button>
        )}
      </div>
    </div>
  );
}
