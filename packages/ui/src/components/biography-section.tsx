import { useId, useState } from 'react';
import { cn } from '../lib/utils';
import { DetailSection, DetailSectionEmpty } from './detail-section';
import { Button } from './ui/button';

const TITLE = 'Biography';

/** Runs past the six clamped lines even at the full width of the column, so a press always adds text. */
const LONG_BIOGRAPHY_LENGTH = 600;

export type BiographySectionProps = {
  /** Plain text, with the paragraph breaks of TMDB; `null` → one muted line. */
  biography: string | null;
};

/** Sits in the column of the hero, so it takes that gutter and has none of its own. */
export function BiographySection({ biography }: BiographySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const textId = useId();

  if (biography === null) {
    return (
      <DetailSection title={TITLE} gutterClassName="">
        <DetailSectionEmpty>No biography yet.</DetailSectionEmpty>
      </DetailSection>
    );
  }

  const isLong = biography.length > LONG_BIOGRAPHY_LENGTH;

  return (
    <DetailSection title={TITLE} gutterClassName="">
      <p
        id={textId}
        className={cn(
          'text-muted-foreground leading-relaxed wrap-anywhere whitespace-pre-line sm:text-lg',
          isLong && !isExpanded && 'line-clamp-6'
        )}
      >
        {biography}
      </p>
      {isLong && (
        <Button
          variant="link"
          aria-expanded={isExpanded}
          aria-controls={textId}
          className="touch-target mt-1 px-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </Button>
      )}
    </DetailSection>
  );
}
