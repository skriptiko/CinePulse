import { type DiscoverSortBy, SEARCH_QUERY_MAX_LENGTH } from '@repo/api';
import { ROUTE_PATHS } from '@repo/routes';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useSearchParams } from 'react-router-dom';

export const SORT_OPTIONS = ['popular', 'newest', 'rating'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const DEFAULT_SORT: SortOption = 'popular';
export const SEARCH_DEBOUNCE_MS = 300;

/** URL search param names of the Movies page. */
export const FILTER_PARAMS = { query: 'q', genre: 'genre', sort: 'sort' } as const;
type FilterParam = (typeof FILTER_PARAMS)[keyof typeof FILTER_PARAMS];

export type MovieFilters = {
  /** Trimmed search text; `''` when not searching. */
  query: string;
  /** TMDB genre id; `null` means every genre. */
  genreId: number | null;
  sort: SortOption;
};

/** Reads the filters from the URL; a missing or invalid value falls back to its default. */
export function parseMovieFilters(params: URLSearchParams): MovieFilters {
  return {
    query: normalizeQuery(params.get(FILTER_PARAMS.query) ?? ''),
    genreId: parseGenreId(params.get(FILTER_PARAMS.genre)),
    sort: parseSort(params.get(FILTER_PARAMS.sort)),
  };
}

/** Link to Movies filtered by one genre, e.g. from the Home genre pills. */
export function moviesHrefForGenre(genreId: number): string {
  const params = new URLSearchParams({ [FILTER_PARAMS.genre]: String(genreId) });
  return `${ROUTE_PATHS.MOVIES}?${params}`;
}

export function normalizeQuery(value: string): string {
  return value.trim().slice(0, SEARCH_QUERY_MAX_LENGTH);
}

function parseGenreId(value: string | null): number | null {
  if (value === null || !/^[1-9]\d{0,9}$/.test(value)) return null;
  return Number(value);
}

function parseSort(value: string | null): SortOption {
  return SORT_OPTIONS.find((option) => option === value) ?? DEFAULT_SORT;
}

export function isSortOption(value: string): value is SortOption {
  return SORT_OPTIONS.some((option) => option === value);
}

export function toDiscoverSortBy(sort: SortOption): DiscoverSortBy {
  switch (sort) {
    case 'popular':
      return 'popularity.desc';
    case 'newest':
      return 'primary_release_date.desc';
    case 'rating':
      return 'vote_average.desc';
    default: {
      const unhandled: never = sort;
      return unhandled;
    }
  }
}

export const SORT_LABELS: Record<SortOption, string> = {
  popular: 'Popular',
  newest: 'Newest',
  rating: 'Rating',
};

/** Writes `value` to `params`, dropping the param when it holds the default. */
function setParam(params: URLSearchParams, name: string, value: string | null): void {
  if (value === null || value === '') params.delete(name);
  else params.set(name, value);
}

/**
 * Movies filters as URL state. Genre and sort are written with push (each choice is a
 * history entry); the search text is debounced and written with replace, so typing does not
 * flood the history. Every write runs in a transition: the current results stay on screen
 * while the next ones load, and `isPending` tells the page to mark them stale.
 */
export function useMovieFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchKey = searchParams.toString();
  // Keyed by the string, so `filters` keeps its identity until the URL really changes.
  const filters = useMemo(() => parseMovieFilters(new URLSearchParams(searchKey)), [searchKey]);

  // The input is local state: it changes on every keystroke, the URL only after the debounce.
  const [searchInput, setSearchInputState] = useState(filters.query);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastWrittenQueryRef = useRef(filters.query);

  // The params as last written: `setSearchParams(fn)` would see the render's params, so two
  // writes before a commit (a genre click, then the debounced query) would drop one.
  const latestParamsRef = useRef(searchParams);
  useEffect(() => {
    latestParamsRef.current = new URLSearchParams(searchKey);
  }, [searchKey]);

  const update = useCallback(
    (changes: Partial<Record<FilterParam, string | null>>, replace: boolean) => {
      const next = new URLSearchParams(latestParamsRef.current);
      for (const [name, value] of Object.entries(changes)) {
        setParam(next, name, value);
      }
      latestParamsRef.current = next;
      startTransition(() => setSearchParams(next, { replace }));
    },
    [setSearchParams]
  );

  const writeQuery = useCallback(
    (value: string) => {
      const query = normalizeQuery(value);
      lastWrittenQueryRef.current = query;
      update({ [FILTER_PARAMS.query]: query }, true);
    },
    [update]
  );

  const cancelPendingQuery = useCallback(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = undefined;
  }, []);

  // The URL changed from outside (back/forward, a link): show its query in the input.
  useEffect(() => {
    if (filters.query === lastWrittenQueryRef.current) return;
    lastWrittenQueryRef.current = filters.query;
    cancelPendingQuery();
    setSearchInputState(filters.query);
  }, [filters.query, cancelPendingQuery]);

  useEffect(() => cancelPendingQuery, [cancelPendingQuery]);

  const setSearchInput = useCallback(
    (value: string) => {
      setSearchInputState(value);
      cancelPendingQuery();
      debounceRef.current = setTimeout(() => {
        debounceRef.current = undefined;
        if (normalizeQuery(value) !== lastWrittenQueryRef.current) writeQuery(value);
      }, SEARCH_DEBOUNCE_MS);
    },
    [cancelPendingQuery, writeQuery]
  );

  const clearSearch = useCallback(() => {
    cancelPendingQuery();
    setSearchInputState('');
    writeQuery('');
  }, [cancelPendingQuery, writeQuery]);

  const setGenre = useCallback(
    (genreId: number | null) =>
      update({ [FILTER_PARAMS.genre]: genreId === null ? null : String(genreId) }, false),
    [update]
  );

  const setSort = useCallback(
    (sort: SortOption) =>
      update({ [FILTER_PARAMS.sort]: sort === DEFAULT_SORT ? null : sort }, false),
    [update]
  );

  const resetFilters = useCallback(() => {
    cancelPendingQuery();
    setSearchInputState('');
    lastWrittenQueryRef.current = '';
    update(
      { [FILTER_PARAMS.query]: null, [FILTER_PARAMS.genre]: null, [FILTER_PARAMS.sort]: null },
      false
    );
  }, [cancelPendingQuery, update]);

  return {
    filters,
    searchInput,
    /** The typed text is not in the URL yet, or the URL's results are still loading. */
    isStale: isPending || normalizeQuery(searchInput) !== filters.query,
    setSearchInput,
    clearSearch,
    setGenre,
    setSort,
    resetFilters,
  };
}
