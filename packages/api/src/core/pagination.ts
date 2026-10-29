import type { PaginatedResponse } from '../types';

/** TMDB serves at most 500 pages of any list; page 501 is rejected. */
export const TMDB_MAX_PAGES = 500;

/** Shared `getNextPageParam` of every infinite query: `undefined` ends the list. */
export function getNextPageParam(lastPage: PaginatedResponse<unknown>): number | undefined {
  const lastPageNumber = Math.min(lastPage.total_pages, TMDB_MAX_PAGES);
  return lastPage.page < lastPageNumber ? lastPage.page + 1 : undefined;
}
