import { useMovieGenres, useMovies, useTrending } from '@repo/api';
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

const FEATURED_COUNT = 5;

export function Home() {
  const { data: genresData } = useMovieGenres();
  const { data: trendingData } = useTrending('movie', 'day');
  const { data: popularData } = useMovies('popular');
  const { data: topRatedData } = useMovies('top_rated');
  const { data: upcomingData } = useMovies('upcoming');

  const genres = genresData.genres;
  const categories = ['All', ...genres.map((genre) => genre.name)];

  const trendingResults = trendingData.pages[0]?.results ?? [];
  const topRatedResults = topRatedData.pages[0]?.results ?? [];

  const heroMovie = trendingResults.find(isTrendingMovie);
  const trendingMovies = trendingResults.filter(isTrendingCard).map(toTrendingCardData);
  const featuredItems = topRatedResults
    .slice(0, FEATURED_COUNT)
    .map((movie) => toFeaturedItemData(movie, genres));
  const upcomingMovies = (upcomingData.pages[0]?.results ?? []).map(toMovieCardData);
  const topRatedMovies = topRatedResults.map(toMovieCardData);
  const popularMovies = (popularData.pages[0]?.results ?? []).map(toMovieCardData);

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
