import { describe, expect, it } from 'vitest';
import { TMDB_MAX_PAGES, getNextPageParam } from '../pagination';

function page(pageNumber: number, totalPages: number) {
  return { page: pageNumber, results: [], total_pages: totalPages, total_results: totalPages * 20 };
}

describe('getNextPageParam', () => {
  it('returns the next page while there are more', () => {
    expect(getNextPageParam(page(1, 3))).toBe(2);
    expect(getNextPageParam(page(2, 3))).toBe(3);
  });

  it('ends on the last page', () => {
    expect(getNextPageParam(page(3, 3))).toBeUndefined();
  });

  it('ends on an empty result', () => {
    expect(getNextPageParam(page(1, 0))).toBeUndefined();
  });

  it(`stops at page ${TMDB_MAX_PAGES} even when TMDB reports more`, () => {
    expect(TMDB_MAX_PAGES).toBe(500);
    expect(getNextPageParam(page(499, 1200))).toBe(500);
    expect(getNextPageParam(page(500, 1200))).toBeUndefined();
  });
});
