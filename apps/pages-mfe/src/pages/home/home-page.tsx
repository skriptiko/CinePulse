import { genreQueries, movieQueries, trendingQueries } from '@repo/api';
import { usePageMeta } from '@repo/ui';
import { usePrefetchQuery } from '@tanstack/react-query';
import { FeaturedSection } from './featured-section';
import { GenresSection } from './genres-section';
import { HeroSection } from './hero-section';
import { MovieRowSection } from './movie-row-section';
import { TrendingSection } from './trending-section';

/**
 * Each section suspends and fails on its own. The page starts every request up front:
 * React 19 renders suspended siblings one after another, so without the prefetch the rows
 * would load as a waterfall.
 */
export function Home() {
  usePageMeta();
  usePrefetchQuery(trendingQueries.row('movie', 'day'));
  usePrefetchQuery(genreQueries.movie());
  usePrefetchQuery(movieQueries.row('top_rated'));
  usePrefetchQuery(movieQueries.row('upcoming'));
  usePrefetchQuery(movieQueries.row('popular'));

  return (
    <div>
      <h1 className="sr-only">CinePulse: trending and popular movies</h1>
      <HeroSection />
      <div className="relative z-10 -mt-16 space-y-12 pb-16">
        <GenresSection />
        <TrendingSection />
        <FeaturedSection />
        <MovieRowSection category="upcoming" title="New Releases" />
        <MovieRowSection category="top_rated" title="Top Rated" />
        <MovieRowSection category="popular" title="Popular" />
      </div>
    </div>
  );
}
