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
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
        <Search className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-medium mb-2">
        {query ? `No movies found for “${query}”` : 'No movies found'}
      </h2>
      <p className="text-muted-foreground text-sm max-w-md">
        {query
          ? 'Check the spelling or try a different title.'
          : 'Try a different genre or reset the filters.'}
      </p>
      <div className="flex gap-2 mt-4">
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
