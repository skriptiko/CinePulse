import { useMovieGenres, useMovies, useTVGenres, useTVShows, useTrending } from '@repo/api';

function TrendingSection() {
  const { data } = useTrending('all', 'day');
  const items = data.pages[0].results.slice(0, 10);

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Trending Today</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {items.map((item) => (
          <div
            key={`trending-${item.id}`}
            className="bg-gray-800 rounded-lg p-2 border border-gray-700"
          >
            <p className="font-semibold truncate">
              {'title' in item ? item.title : 'name' in item ? item.name : 'Unknown'}
            </p>
            <p className="text-sm text-gray-400 capitalize">{item.media_type}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MoviesSection() {
  const { data } = useMovies('popular');
  const items = data.pages[0].results.slice(0, 10);

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Popular Movies</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {items.map((movie) => (
          <div
            key={`movie-${movie.id}`}
            className="bg-gray-800 rounded-lg p-2 border border-gray-700"
          >
            <p className="font-semibold truncate">{movie.title}</p>
            <p className="text-sm text-gray-400">{movie.release_date}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TVShowsSection() {
  const { data } = useTVShows('popular');
  const items = data.pages[0].results.slice(0, 10);

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Popular TV Shows</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {items.map((tv) => (
          <div key={`tv-${tv.id}`} className="bg-gray-800 rounded-lg p-2 border border-gray-700">
            <p className="font-semibold truncate">{tv.name}</p>
            <p className="text-sm text-gray-400">{tv.first_air_date}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function GenresSection() {
  const { data: movieGenres } = useMovieGenres();
  const { data: tvGenres } = useTVGenres();

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Genres</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        <h3 className="w-full text-lg font-semibold mb-2">Movies</h3>
        {movieGenres.genres.slice(0, 12).map((genre) => (
          <span
            key={`movie-genre-${genre.id}`}
            className="px-3 py-1 bg-blue-600 rounded-full text-sm"
          >
            {genre.name}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <h3 className="w-full text-lg font-semibold mb-2">TV Shows</h3>
        {tvGenres.genres.slice(0, 12).map((genre) => (
          <span
            key={`tv-genre-${genre.id}`}
            className="px-3 py-1 bg-purple-600 rounded-full text-sm"
          >
            {genre.name}
          </span>
        ))}
      </div>
    </section>
  );
}

function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-white">CinePulse Discover</h1>
      <TrendingSection />
      <MoviesSection />
      <TVShowsSection />
      <GenresSection />
    </div>
  );
}

export default Home;
