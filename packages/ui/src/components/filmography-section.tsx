import { type Ref, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DetailSection, DetailSectionEmpty } from './detail-section';
import { Button } from './ui/button';

const VISIBLE_CREDITS = 30;

/** In the URL, so Back to the page finds the list as it was and the reader at their row. */
const CREDITS_PARAM = 'credits';
const ALL_CREDITS = 'all';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const firstNewLinkRef = useRef<HTMLAnchorElement>(null);
  const wasPressedRef = useRef(false);
  const isExpanded = searchParams.get(CREDITS_PARAM) === ALL_CREDITS;
  const visibleCredits = isExpanded ? credits : credits.slice(0, VISIBLE_CREDITS);

  useEffect(() => {
    // The press takes the button away, and focus would fall back to the top of the page. A page
    // that opens with the whole list had no press, and focus and scroll stay where they are.
    if (isExpanded && wasPressedRef.current) firstNewLinkRef.current?.focus();
    wasPressedRef.current = false;
  }, [isExpanded]);

  const handleShowAll = () => {
    wasPressedRef.current = true;
    const next = new URLSearchParams(searchParams);
    next.set(CREDITS_PARAM, ALL_CREDITS);
    setSearchParams(next, { replace: true });
  };

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
        <Button variant="secondary" className="mt-6" onClick={handleShowAll}>
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
