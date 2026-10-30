import { trendingQueries } from '@repo/api';
import { Hero, HeroSkeleton, toHeroData } from '@repo/ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import { SectionBoundary } from './section-boundary';
import { isTrendingMovie } from './trending';

export function HeroSection() {
  return (
    <SectionBoundary fallback={<HeroSkeleton />}>
      <TrendingHero />
    </SectionBoundary>
  );
}

function TrendingHero() {
  const { data: trending } = useSuspenseQuery(trendingQueries.row('movie', 'day'));
  const heroMovie = trending.results.find(isTrendingMovie);

  if (heroMovie === undefined) return null;
  return <Hero movie={toHeroData(heroMovie)} />;
}
