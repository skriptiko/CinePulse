import { SEARCH_QUERY_MAX_LENGTH, genreQueries } from '@repo/api';
import {
  CategoryPills,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Input,
  ToggleGroup,
  ToggleGroupItem,
  buttonVariants,
  cn,
} from '@repo/ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ChevronDown, Grid3X3, LayoutGrid, Search, SlidersHorizontal } from 'lucide-react';
import { type FormEvent, useId, useMemo } from 'react';
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
  const searchId = useId();

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

  // Results follow the input as the user types, so Enter has nothing left to submit.
  const handleSearchSubmit = (event: FormEvent) => event.preventDefault();

  return (
    <div className="sticky top-16 sm:top-20 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="px-4 sm:px-6 lg:px-12 py-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <search className="relative flex-1 max-w-md">
              <form onSubmit={handleSearchSubmit}>
                <label htmlFor={searchId} className="sr-only">
                  Search movies
                </label>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id={searchId}
                  type="search"
                  placeholder="Search movies..."
                  value={searchInput}
                  onChange={(event) => onSearchChange(event.target.value)}
                  maxLength={SEARCH_QUERY_MAX_LENGTH}
                  className="pl-10 h-10 bg-secondary border-0 rounded-lg"
                />
              </form>
            </search>

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
                  <DropdownMenuRadioGroup
                    aria-label="Sort by"
                    value={sort}
                    onValueChange={handleSortChange}
                  >
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
            label="Filter by genre"
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
  const handleValueChange = (value: string) => {
    const next = VIEW_MODES.find(({ mode }) => mode === value);
    if (next) onViewModeChange(next.mode);
  };

  return (
    <ToggleGroup aria-label="Card size" value={viewMode} onValueChange={handleValueChange}>
      {VIEW_MODES.map(({ mode, label, Icon }) => (
        <ToggleGroupItem key={mode} value={mode} aria-label={label}>
          <Icon className="w-4 h-4" aria-hidden="true" />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
