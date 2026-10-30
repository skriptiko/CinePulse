import { SEARCH_QUERY_MAX_LENGTH, genreQueries } from '@repo/api';
import {
  CategoryPills,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Input,
  buttonVariants,
  cn,
} from '@repo/ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ChevronDown, Grid3X3, LayoutGrid, Search, SlidersHorizontal } from 'lucide-react';
import { useMemo } from 'react';
import { SORT_LABELS, SORT_OPTIONS, type SortOption, isSortOption } from './use-movie-filters';

export type ViewMode = 'grid' | 'compact';

const ALL_GENRES = 'All';

export type MoviesFiltersProps = {
  searchInput: string;
  onSearchChange: (value: string) => void;
  genreId: number | null;
  onGenreChange: (genreId: number | null) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  /** TMDB search has no genre or sort, so both are disabled while a query is typed. */
  isSearching: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
};

export function MoviesFilters({
  searchInput,
  onSearchChange,
  genreId,
  onGenreChange,
  sort,
  onSortChange,
  isSearching,
  viewMode,
  onViewModeChange,
}: MoviesFiltersProps) {
  const { data: genresData } = useSuspenseQuery(genreQueries.movie());

  const genreNames = useMemo(
    () => [ALL_GENRES, ...genresData.genres.map((genre) => genre.name)],
    [genresData]
  );
  const activeGenreName =
    genresData.genres.find((genre) => genre.id === genreId)?.name ?? ALL_GENRES;

  const handleGenreChange = (name: string) => {
    const genre = genresData.genres.find((item) => item.name === name);
    onGenreChange(genre ? genre.id : null);
  };

  const handleSortChange = (value: string) => {
    if (isSortOption(value)) onSortChange(value);
  };

  return (
    <div className="sticky top-16 sm:top-20 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="px-4 sm:px-6 lg:px-12 py-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search movies..."
                value={searchInput}
                onChange={(event) => onSearchChange(event.target.value)}
                maxLength={SEARCH_QUERY_MAX_LENGTH}
                aria-label="Search movies"
                className="pl-10 h-10 bg-secondary border-0 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={`Sort by: ${SORT_LABELS[sort]}`}
                  disabled={isSearching}
                  className={cn(buttonVariants({ variant: 'secondary' }), 'rounded-lg gap-2 h-10')}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">{SORT_LABELS[sort]}</span>
                  <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuRadioGroup value={sort} onValueChange={handleSortChange}>
                    {SORT_OPTIONS.map((option) => (
                      <DropdownMenuRadioItem key={option} value={option}>
                        {SORT_LABELS[option]}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
            </div>
          </div>

          <CategoryPills
            categories={genreNames}
            value={activeGenreName}
            onValueChange={handleGenreChange}
            disabled={isSearching}
            className="px-0 -mx-4 sm:mx-0 sm:px-0"
          />

          {isSearching && (
            <p className="text-xs text-muted-foreground">
              Genre and sort don&apos;t apply to search results. Clear the search to use them.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

type ViewModeToggleProps = {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
};

const VIEW_MODES = [
  { mode: 'grid', label: 'Large cards', Icon: LayoutGrid },
  { mode: 'compact', label: 'Compact cards', Icon: Grid3X3 },
] as const;

function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center rounded-lg bg-secondary p-1">
      {VIEW_MODES.map(({ mode, label, Icon }) => (
        <button
          key={mode}
          type="button"
          aria-label={label}
          aria-pressed={viewMode === mode}
          onClick={() => onViewModeChange(mode)}
          className={cn(
            'p-2 rounded-md transition-colors',
            viewMode === mode
              ? 'bg-background text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="w-4 h-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
