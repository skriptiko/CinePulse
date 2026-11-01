import { trendingQueries } from '@repo/api';
import { Hero, HeroSkeleton, toHeroData } from '@repo/ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import { SectionBoundary } from './section-boundary';
import { isTrendingMovie } from './trending';

/**
 * Back up under the Header, over the padding of the page, which every other state keeps. The rows
 * are pulled over the padding of the hero by less than it measures, to clear its button.
 */
const HERO_PLACEMENT_CLASS = '-mt-20 -mb-8 sm:-mt-24 sm:-mb-16';

export function HeroSection() {
  return (
    <SectionBoundary
      fallback={
        <div className={HERO_PLACEMENT_CLASS}>
          <HeroSkeleton />
        </div>
      }
    >
      <TrendingHero />
    </SectionBoundary>
  );
}

function TrendingHero() {
  const { data: trending } = useSuspenseQuery(trendingQueries.row('movie', 'day'));
  const heroMovie = trending.results.find(isTrendingMovie);

  if (heroMovie === undefined) return null;
  return <Hero movie={toHeroData(heroMovie)} className={HERO_PLACEMENT_CLASS} />;
}
