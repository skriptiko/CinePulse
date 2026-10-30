import { genreQueries, movieQueries, trendingQueries } from '@repo/api';
import type { TrendingItem, TrendingMovie, TrendingTV } from '@repo/api';
import {
  CategoryPills,
  ContentRow,
  FeaturedGrid,
  Hero,
  toFeaturedItemData,
  toHeroData,
  toMovieCardData,
  toTrendingCardData,
} from '@repo/ui';
import { useSuspenseQueries } from '@tanstack/react-query';

const FEATURED_COUNT = 5;

export function Home() {
  // One call starts every request at once; consecutive suspense hooks would run one by one.
  const [genresQuery, trendingQuery, popularQuery, topRatedQuery, upcomingQuery] =
    useSuspenseQueries({
      queries: [
        genreQueries.movie(),
        trendingQueries.row('movie', 'day'),
        movieQueries.row('popular'),
        movieQueries.row('top_rated'),
        movieQueries.row('upcoming'),
      ],
    });

  const genres = genresQuery.data.genres;
  const categories = ['All', ...genres.map((genre) => genre.name)];

  const trendingResults = trendingQuery.data.results;
  const topRatedResults = topRatedQuery.data.results;

  const heroMovie = trendingResults.find(isTrendingMovie);
  const trendingMovies = trendingResults.filter(isTrendingCard).map(toTrendingCardData);
  const featuredItems = topRatedResults
    .slice(0, FEATURED_COUNT)
    .map((movie) => toFeaturedItemData(movie, genres));
  const upcomingMovies = upcomingQuery.data.results.map(toMovieCardData);
  const topRatedMovies = topRatedResults.map(toMovieCardData);
  const popularMovies = popularQuery.data.results.map(toMovieCardData);

  return (
    <main>
      {/* Hero Section */}
      {heroMovie !== undefined && <Hero movie={toHeroData(heroMovie)} />}

      {/* Content Sections */}
      <div className="relative z-10 -mt-16 space-y-12 pb-16">
        {/* Categories */}
        <CategoryPills categories={categories} />

        {/* Trending Now */}
        {trendingMovies.length > 0 && <ContentRow title="Trending Now" movies={trendingMovies} />}

        {/* Featured Grid */}
        {featuredItems.length > 0 && (
          <FeaturedGrid
            title="Editor's Picks"
            items={featuredItems}
            className="max-w-[1800px] mx-auto"
          />
        )}

        {/* New Releases */}
        {upcomingMovies.length > 0 && <ContentRow title="New Releases" movies={upcomingMovies} />}

        {/* Top Rated */}
        {topRatedMovies.length > 0 && <ContentRow title="Top Rated" movies={topRatedMovies} />}

        {/* Popular */}
        {popularMovies.length > 0 && <ContentRow title="Popular" movies={popularMovies} />}
      </div>
    </main>
  );
}

function isTrendingMovie(item: TrendingItem): item is TrendingMovie {
  return item.media_type === 'movie';
}

/** People can trend too, but only movies and shows render as cards. */
function isTrendingCard(item: TrendingItem): item is TrendingMovie | TrendingTV {
  return item.media_type !== 'person';
}
