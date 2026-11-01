import type { PaginatedResponse, Review } from '@repo/api';
import type { ReviewData } from '../../components/reviews-section';
import { formatRating, formatTimestamp } from '../format';
import { toHttpsUrl } from './https-url';

const REVIEW_LIMIT = 3;

export function toReviewsData(
  reviews: Partial<PaginatedResponse<Review>> | undefined
): ReviewData[] {
  return (reviews?.results ?? []).slice(0, REVIEW_LIMIT).map(toReviewData);
}

function toReviewData(review: Review): ReviewData {
  return {
    id: review.id,
    author: review.author,
    rating: formatRating(review.author_details?.rating),
    // `created_at` is a full timestamp, not the calendar date `formatDate` reads.
    date: formatTimestamp(review.created_at),
    text: review.content,
    url: toHttpsUrl(review.url),
  };
}
