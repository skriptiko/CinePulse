import { getImageUrl, useMovieGenres, useMovies, useTrending } from '@repo/api';
import { CategoryPills, ContentRow, FeaturedGrid, Hero, mapTmdbToMovieCard } from '@repo/ui';
import { useMemo } from 'react';

function Home() {
  const { data: genresData } = useMovieGenres();
  const { data: trendingData } = useTrending('movie', 'day');
  const { data: popularData } = useMovies('popular');
  const { data: topRatedData } = useMovies('top_rated');
  const { data: upcomingData } = useMovies('upcoming');

  const categories = useMemo(() => {
    const list = genresData?.genres.map((g) => g.name) || [];
    return ['All', ...list];
  }, [genresData]);

  // Transform TMDB data for our components
  const trendingMovies = useMemo(() => {
    if (!trendingData?.pages[0]?.results) return [];
    return trendingData.pages[0].results
      .filter((m): m is any => m.media_type === 'movie')
      .map((m) => ({
        ...mapTmdbToMovieCard(m),
        id: m.id,
      }));
  }, [trendingData]);

  const popularMovies = useMemo(() => {
    if (!popularData?.pages[0]?.results) return [];
    return popularData.pages[0].results.map((m) => ({
      ...mapTmdbToMovieCard(m),
      id: m.id,
    }));
  }, [popularData]);

  const topRatedMovies = useMemo(() => {
    if (!topRatedData?.pages[0]?.results) return [];
    return topRatedData.pages[0].results.map((m) => ({
      ...mapTmdbToMovieCard(m),
      id: m.id,
    }));
  }, [topRatedData]);

  const upcomingMovies = useMemo(() => {
    if (!upcomingData?.pages[0]?.results) return [];
    return upcomingData.pages[0].results.map((m) => ({
      ...mapTmdbToMovieCard(m),
      id: m.id,
    }));
  }, [upcomingData]);

  const featuredItems = useMemo(() => {
    if (!topRatedData?.pages[0]?.results) return [];
    return topRatedData.pages[0].results.slice(0, 5).map((m) => {
      const genreNames =
        m.genre_ids
          ?.map((id) => genresData?.genres.find((g) => g.id === id)?.name)
          .filter(Boolean) || [];

      return {
        id: m.id,
        title: m.title,
        imageUrl: getImageUrl(m.backdrop_path, 'original') || '',
        rating: m.vote_average,
        genre: genreNames[0] || 'Movie',
        year: m.release_date?.split('-')[0] || '',
      };
    });
  }, [topRatedData, genresData]);

  const heroMovie = useMemo(() => {
    const movies = trendingData?.pages[0]?.results.filter(
      (m): m is any => m.media_type === 'movie'
    );
    if (!movies?.[0]) return null;
    const m = movies[0];
    return {
      title: m.title,
      description: m.overview,
      rating: m.vote_average ? m.vote_average.toFixed(1) : 'N/A',
      year: m.release_date?.split('-')[0] || '',
      duration: 'Action', // Trending movie list doesn't have runtime
      imageUrl: getImageUrl(m.backdrop_path, 'original') || '',
    };
  }, [trendingData]);

  return (
    <>
      <main>
        {/* Hero Section */}
        {heroMovie && (
          <Hero
            title={heroMovie.title}
            description={heroMovie.description}
            rating={heroMovie.rating}
            year={heroMovie.year}
            duration={heroMovie.duration}
            imageUrl={heroMovie.imageUrl}
          />
        )}

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
    </>
  );
}

export default Home;
