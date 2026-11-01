import { buildMovie, buildPaginated } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { toMoreLikeThisData } from '../more-like-this';

describe('toMoreLikeThisData', () => {
  it('prefers the recommendations', () => {
    const titles = toMoreLikeThisData(
      buildPaginated([buildMovie({ title: 'Recommended' })]),
      buildPaginated([buildMovie({ title: 'Similar' })])
    );

    expect(titles.map((title) => title.title)).toEqual(['Recommended']);
  });

  it('falls back to similar titles when there are no recommendations', () => {
    const titles = toMoreLikeThisData(
      buildPaginated([]),
      buildPaginated([buildMovie({ title: 'Similar' })])
    );

    expect(titles.map((title) => title.title)).toEqual(['Similar']);
  });

  it('shows at most 12', () => {
    const movies = Array.from({ length: 14 }, () => buildMovie());

    expect(toMoreLikeThisData(buildPaginated(movies), buildPaginated([]))).toHaveLength(12);
  });

  it('degrades to an empty list when TMDB leaves the blocks out', () => {
    expect(toMoreLikeThisData(undefined, undefined)).toEqual([]);
  });
});
