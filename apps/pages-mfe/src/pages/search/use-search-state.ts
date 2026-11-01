import { ROUTE_PATHS } from '@repo/routes';
import { useSearchParams } from 'react-router-dom';
import { normalizeQuery } from '../../components/catalog/use-catalog-filters';

export const SEARCH_TYPES = ['movie', 'tv', 'person'] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

const DEFAULT_SEARCH_TYPE: SearchType = 'movie';

/** URL search param names of the Search page. */
const SEARCH_PARAMS = { query: 'q', type: 'type' } as const;

export type SearchLabels = {
  tab: string;
  /** `1 movie found`. */
  singular: string;
  /** `4 movies found`, `No movies found for “dune”`. */
  plural: string;
};

export const SEARCH_LABELS: Record<SearchType, SearchLabels> = {
  movie: { tab: 'Movies', singular: 'movie', plural: 'movies' },
  tv: { tab: 'TV Shows', singular: 'TV show', plural: 'TV shows' },
  person: { tab: 'People', singular: 'person', plural: 'people' },
};

export type SearchState = {
  /** Trimmed search text; `''` when there is nothing to search for. */
  query: string;
  type: SearchType;
};

/**
 * Reads the search from the URL. A query over the limit is not cut, unlike on Movies: a page that
 * searched for something other than its URL says would be wrong, so the proxy refuses it instead
 * and the results show their error.
 */
export function parseSearchState(params: URLSearchParams): SearchState {
  const type = params.get(SEARCH_PARAMS.type);

  return {
    query: (params.get(SEARCH_PARAMS.query) ?? '').trim(),
    type: SEARCH_TYPES.find((option) => option === type) ?? DEFAULT_SEARCH_TYPE,
  };
}

/** The Search page for a query and a type, so each tab is a link that can be shared. */
export function searchHref(query: string, type: SearchType): string {
  const params = new URLSearchParams();
  if (query !== '') params.set(SEARCH_PARAMS.query, query);
  if (type !== DEFAULT_SEARCH_TYPE) params.set(SEARCH_PARAMS.type, type);
  const search = params.toString();

  return search === '' ? ROUTE_PATHS.SEARCH : `${ROUTE_PATHS.SEARCH}?${search}`;
}

/** The search as URL state. A submit pushes, so Back returns to the search before it. */
export function useSearchState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { query, type } = parseSearchState(searchParams);

  const submit = (text: string) => {
    const nextQuery = normalizeQuery(text);
    if (nextQuery === query) return;

    const next = new URLSearchParams(searchParams);
    if (nextQuery === '') next.delete(SEARCH_PARAMS.query);
    else next.set(SEARCH_PARAMS.query, nextQuery);
    setSearchParams(next);
  };

  return { query, type, submit };
}
