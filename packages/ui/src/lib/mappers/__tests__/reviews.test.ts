import type { Review } from '@repo/api';
import { buildPaginated } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { toReviewsData } from '../reviews';

function review(overrides: Partial<Review> = {}): Review {
  return {
    id: 'review-1',
    author: 'garethmb',
    author_details: { rating: 8 },
    content: 'A *great* film.',
    created_at: '2024-03-15T12:00:00.000Z',
    url: 'https://www.themoviedb.org/review/review-1',
    ...overrides,
  };
}

describe('toReviewsData', () => {
  it('maps the author, rating, date, plain text and link', () => {
    expect(toReviewsData(buildPaginated([review()]))).toEqual([
      {
        id: 'review-1',
        author: 'garethmb',
        rating: '8.0',
        date: 'Mar 15, 2024',
        text: 'A *great* film.',
        url: 'https://www.themoviedb.org/review/review-1',
      },
    ]);
  });

  it('takes the first 3', () => {
    const reviews = ['a', 'b', 'c', 'd'].map((id) => review({ id }));

    expect(toReviewsData(buildPaginated(reviews)).map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('keeps a rating of 0, which is a real rating, and drops a missing one', () => {
    const data = toReviewsData(
      buildPaginated([
        review({ id: 'zero', author_details: { rating: 0 } }),
        review({ id: 'none', author_details: { rating: null } }),
      ])
    );

    expect(data.map((item) => item.rating)).toEqual(['0.0', null]);
  });

  it('survives a review with no author details or a broken date', () => {
    const broken = { ...review({ created_at: 'not a date' }), author_details: undefined };

    expect(toReviewsData(buildPaginated([broken as unknown as Review]))[0]).toMatchObject({
      rating: null,
      date: null,
    });
  });

  it('drops a link that is not https', () => {
    const data = toReviewsData(buildPaginated([review({ url: 'javascript:alert(1)' })]));

    expect(data[0]?.url).toBeNull();
  });

  it('degrades to an empty list when TMDB leaves the block out', () => {
    expect(toReviewsData(undefined)).toEqual([]);
  });
});
