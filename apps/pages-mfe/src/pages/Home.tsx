import {
  useMovieGenres,
  useMovies,
  useSearchMulti,
  useTVGenres,
  useTVShows,
  useTrending,
} from '@repo/api/hooks';
import { Suspense } from 'react';

function MoviesList({
  category,
  title,
}: { category: 'popular' | 'top_rated' | 'upcoming' | 'now_playing'; title: string }) {
  const { data } = useMovies(category);
  const items = data.pages.flatMap((p) => p.results).slice(0, 10);

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <ul className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {items.map((movie) => (
          <li key={movie.id} className="bg-card p-3 rounded-lg">
            <p className="font-medium truncate">{movie.title}</p>
            <p className="text-sm text-muted-foreground">Rating: {movie.vote_average}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TVShowsList({
  category,
  title,
}: { category: 'popular' | 'top_rated' | 'on_the_air' | 'airing_today'; title: string }) {
  const { data } = useTVShows(category);
  const items = data.pages.flatMap((p) => p.results).slice(0, 10);

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <ul className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {items.map((show) => (
          <li key={show.id} className="bg-card p-3 rounded-lg">
            <p className="font-medium truncate">{show.name}</p>
            <p className="text-sm text-muted-foreground">Rating: {show.vote_average}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TrendingList({
  mediaType,
  timeWindow,
  title,
}: { mediaType: 'all' | 'movie' | 'tv' | 'person'; timeWindow: 'day' | 'week'; title: string }) {
  const { data } = useTrending(mediaType, timeWindow);
  const items = data.pages.flatMap((p) => p.results).slice(0, 10);

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <ul className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {items.map((item) => (
          <li key={item.id} className="bg-card p-3 rounded-lg">
            <p className="font-medium truncate">{'title' in item ? item.title : item.name}</p>
            <p className="text-sm text-muted-foreground">Type: {item.media_type}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SearchResultsList({ query, title }: { query: string; title: string }) {
  const { data } = useSearchMulti(query);
  const items = data.pages.flatMap((p) => p.results).slice(0, 10);

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <ul className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {items.map((item) => (
          <li key={item.id} className="bg-card p-3 rounded-lg">
            <p className="font-medium truncate">{'title' in item ? item.title : item.name}</p>
            <p className="text-sm text-muted-foreground">Type: {item.media_type}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function GenresList() {
  const { data: movieGenres } = useMovieGenres();
  const { data: tvGenres } = useTVGenres();

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-4">Genres</h2>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold mb-2">Movie Genres (first 10)</h3>
          <ul className="space-y-1">
            {movieGenres.genres.slice(0, 10).map((genre) => (
              <li key={genre.id} className="text-sm">
                {genre.name}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">TV Genres (first 10)</h3>
          <ul className="space-y-1">
            {tvGenres.genres.slice(0, 10).map((genre) => (
              <li key={genre.id} className="text-sm">
                {genre.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function LoadingFallback() {
  return <div className="p-4 text-muted-foreground">Loading...</div>;
}

function Home() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">API Hooks Test Page</h1>

      <Suspense fallback={<LoadingFallback />}>
        <GenresList />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <TrendingList mediaType="all" timeWindow="day" title="Trending Today (All)" />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <TrendingList mediaType="movie" timeWindow="week" title="Trending This Week (Movies)" />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <MoviesList category="popular" title="Popular Movies" />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <MoviesList category="top_rated" title="Top Rated Movies" />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <MoviesList category="upcoming" title="Upcoming Movies" />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <MoviesList category="now_playing" title="Now Playing Movies" />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <TVShowsList category="popular" title="Popular TV Shows" />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <TVShowsList category="top_rated" title="Top Rated TV Shows" />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <TVShowsList category="on_the_air" title="On The Air TV Shows" />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <TVShowsList category="airing_today" title="Airing Today TV Shows" />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <SearchResultsList query="batman" title="Search Results: 'batman'" />
      </Suspense>
    </div>
  );
}

export default Home;
