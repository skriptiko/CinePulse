import { buildMovie, buildPaginated, buildTv } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { toMoreLikeThisData } from '../more-like-this';
import { toMovieCardData, toTvCardData } from '../movie-card';

describe('toMoreLikeThisData', () => {
  it('prefers the recommendations', () => {
    const titles = toMoreLikeThisData(
      buildPaginated([buildMovie({ title: 'Recommended' })]),
      buildPaginated([buildMovie({ title: 'Similar' })]),
      toMovieCardData
    );

    expect(titles.map((title) => title.title)).toEqual(['Recommended']);
  });

  it('falls back to similar titles when there are no recommendations', () => {
    const titles = toMoreLikeThisData(
      buildPaginated([]),
      buildPaginated([buildMovie({ title: 'Similar' })]),
      toMovieCardData
    );

    expect(titles.map((title) => title.title)).toEqual(['Similar']);
  });

  it('shows at most 12', () => {
    const movies = Array.from({ length: 14 }, () => buildMovie());

    expect(
      toMoreLikeThisData(buildPaginated(movies), buildPaginated([]), toMovieCardData)
    ).toHaveLength(12);
  });

  it('builds TV cards from shows, under the same rule', () => {
    const titles = toMoreLikeThisData(
      buildPaginated([]),
      buildPaginated([buildTv({ id: 7, name: 'Similar' })]),
      toTvCardData
    );

    expect(titles).toMatchObject([{ title: 'Similar', mediaType: 'tv', href: '/tv/7' }]);
  });

  it('degrades to an empty list when TMDB leaves the blocks out', () => {
    expect(toMoreLikeThisData(undefined, undefined, toMovieCardData)).toEqual([]);
  });
});
