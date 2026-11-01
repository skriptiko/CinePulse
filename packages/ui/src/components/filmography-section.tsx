import { type Ref, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DetailSection, DetailSectionEmpty } from './detail-section';
import { Button } from './ui/button';

const VISIBLE_CREDITS = 30;

/** One title in `FilmographySection`; build the list with `toFilmographyData`. */
export type FilmographyCreditData = {
  /** Media type and id: a movie and a show can share an id. */
  key: string;
  year: string | null;
  title: string;
  /** Every character and job on this title, already joined. */
  roles: string | null;
  href: string;
};

export type FilmographySectionProps = {
  credits: FilmographyCreditData[];
};

export function FilmographySection({ credits }: FilmographySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const firstNewLinkRef = useRef<HTMLAnchorElement>(null);
  const visibleCredits = isExpanded ? credits : credits.slice(0, VISIBLE_CREDITS);

  useEffect(() => {
    // The press takes the button away, and focus would fall back to the top of the page.
    if (isExpanded) firstNewLinkRef.current?.focus();
  }, [isExpanded]);

  return (
    <DetailSection title="Filmography">
      {credits.length === 0 ? (
        <DetailSectionEmpty>No credits listed.</DetailSectionEmpty>
      ) : (
        <ul className="flex max-w-3xl flex-col gap-3">
          {visibleCredits.map((credit, index) => (
            <FilmographyRow
              key={credit.key}
              credit={credit}
              linkRef={index === VISIBLE_CREDITS ? firstNewLinkRef : undefined}
            />
          ))}
        </ul>
      )}

      {visibleCredits.length < credits.length && (
        <Button variant="secondary" className="mt-6" onClick={() => setIsExpanded(true)}>
          Show all {credits.length} credits
        </Button>
      )}
    </DetailSection>
  );
}

type FilmographyRowProps = {
  credit: FilmographyCreditData;
  linkRef?: Ref<HTMLAnchorElement>;
};

function FilmographyRow({ credit, linkRef }: FilmographyRowProps) {
  const { year, title, roles, href } = credit;

  return (
    <li className="flex gap-4 text-sm">
      <span className="text-muted-foreground w-10 shrink-0 tabular-nums">{year}</span>
      <div className="min-w-0 wrap-anywhere">
        <Link
          ref={linkRef}
          to={href}
          className="touch-target inline-flex items-center font-medium hover:underline"
        >
          {title}
        </Link>
        {roles !== null && <p className="text-muted-foreground">{roles}</p>}
      </div>
    </li>
  );
}
