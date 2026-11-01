import type { ReactNode } from 'react';
import { ContentRow } from './content-row';
import { DETAIL_SECTION_GUTTER, DetailSection, DetailSectionEmpty } from './detail-section';
import type { MovieCardData } from './movie-card';

const TITLE = 'Known for';

export type KnownForSectionProps = {
  /** Build it with `toKnownForData`. */
  titles: MovieCardData[];
  /** Builds each card's `action`. */
  renderCardAction?: (title: MovieCardData) => ReactNode;
};

export function KnownForSection({ titles, renderCardAction }: KnownForSectionProps) {
  if (titles.length === 0) {
    return (
      <DetailSection title={TITLE}>
        <DetailSectionEmpty>No titles to show yet.</DetailSectionEmpty>
      </DetailSection>
    );
  }

  return (
    <ContentRow
      title={TITLE}
      movies={titles}
      renderCardAction={renderCardAction}
      gutterClassName={DETAIL_SECTION_GUTTER}
    />
  );
}
