import { DetailSection, DetailSectionEmpty } from './detail-section';
import { EXTERNAL_TEXT_LINK_CLASS, ExternalLink } from './external-link';

/** What `ReviewsSection` renders; build the list with `toReviewsData`. */
export type ReviewData = {
  id: string;
  author: string;
  /** Formatted, out of 10; `null` hides it (`'0.0'` is shown). */
  rating: string | null;
  date: string | null;
  /** Plain text: markdown in a review stays as typed. */
  text: string;
  /** `null` hides the link. */
  url: string | null;
};

export type ReviewsSectionProps = {
  reviews: ReviewData[];
};

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  return (
    <DetailSection title="Reviews">
      {reviews.length === 0 ? (
        <DetailSectionEmpty>No reviews yet.</DetailSectionEmpty>
      ) : (
        <ul className="flex max-w-3xl flex-col gap-6">
          {reviews.map((review) => (
            <li key={review.id}>
              <ReviewItem review={review} />
            </li>
          ))}
        </ul>
      )}
    </DetailSection>
  );
}

function ReviewItem({ review }: { review: ReviewData }) {
  const { author, rating, date, text, url } = review;

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="min-w-0 font-medium wrap-anywhere">{author}</span>
        {rating !== null && (
          <span className="bg-foreground/10 rounded px-1.5 py-0.5 text-xs font-medium">
            {rating}/10
          </span>
        )}
        {date !== null && <span className="text-muted-foreground">{date}</span>}
      </div>
      <p className="text-muted-foreground mb-1 line-clamp-6 text-sm leading-relaxed wrap-anywhere whitespace-pre-line">
        {text}
      </p>
      {url !== null && (
        <ExternalLink href={url} className={EXTERNAL_TEXT_LINK_CLASS}>
          Read the full review <span className="sr-only">by {author}</span>
        </ExternalLink>
      )}
    </>
  );
}
