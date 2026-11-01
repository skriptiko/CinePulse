import type { ReactNode } from 'react';
import { ContentRow } from './content-row';
import { DETAIL_SECTION_GUTTER, DetailSection, DetailSectionEmpty } from './detail-section';
import type { MovieCardData } from './movie-card';

const TITLE = 'More like this';

export type MoreLikeThisSectionProps = {
  /** Build it with `toMoreLikeThisData`. */
  titles: MovieCardData[];
  /** Builds each card's `action`. */
  renderCardAction?: (title: MovieCardData) => ReactNode;
};

export function MoreLikeThisSection({ titles, renderCardAction }: MoreLikeThisSectionProps) {
  if (titles.length === 0) {
    return (
      <DetailSection title={TITLE}>
        <DetailSectionEmpty>No similar titles yet.</DetailSectionEmpty>
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
