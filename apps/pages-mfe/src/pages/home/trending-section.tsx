import { trendingQueries } from '@repo/api';
import { ContentRow, ContentRowSkeleton, toTrendingCardData } from '@repo/ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import { SectionBoundary } from './section-boundary';
import { isTrendingCard } from './trending';

export function TrendingSection() {
  return (
    <SectionBoundary fallback={<ContentRowSkeleton />}>
      <TrendingRow />
    </SectionBoundary>
  );
}

function TrendingRow() {
  const { data: trending } = useSuspenseQuery(trendingQueries.row('movie', 'day'));
  const trendingMovies = trending.results.filter(isTrendingCard).map(toTrendingCardData);

  if (trendingMovies.length === 0) return null;
  return <ContentRow title="Trending Now" movies={trendingMovies} />;
}
