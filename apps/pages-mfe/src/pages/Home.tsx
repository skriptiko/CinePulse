import { useMovies, useTVShows, useTrending } from '@repo/api';

function Home() {
  const popularMovies = useMovies('popular');
  const topRatedMovies = useMovies('top_rated');
  const upcomingMovies = useMovies('upcoming');
  const nowPlayingMovies = useMovies('now_playing');

  const popularTV = useTVShows('popular');
  const topRatedTV = useTVShows('top_rated');
  const onTheAirTV = useTVShows('on_the_air');
  const airingTodayTV = useTVShows('airing_today');

  const trendingAll = useTrending('all', 'day');
  const trendingMovies = useTrending('movie', 'day');

  const isLoading =
    popularMovies.isLoading ||
    topRatedMovies.isLoading ||
    upcomingMovies.isLoading ||
    nowPlayingMovies.isLoading ||
    popularTV.isLoading ||
    topRatedTV.isLoading ||
    onTheAirTV.isLoading ||
    airingTodayTV.isLoading ||
    trendingAll.isLoading ||
    trendingMovies.isLoading;

  const isError =
    popularMovies.isError ||
    topRatedMovies.isError ||
    upcomingMovies.isError ||
    nowPlayingMovies.isError ||
    popularTV.isError ||
    topRatedTV.isError ||
    onTheAirTV.isError ||
    airingTodayTV.isError ||
    trendingAll.isError ||
    trendingMovies.isError;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading data</div>;
  }

  return (
    <div>
      <h1>Home Page</h1>

      <section>
        <h2>Popular Movies</h2>
        <div>
          {popularMovies.data?.pages[0]?.results.slice(0, 10).map((movie) => (
            <div key={movie.id}>{movie.title}</div>
          ))}
        </div>
      </section>

      <section>
        <h2>Top Rated Movies</h2>
        <div>
          {topRatedMovies.data?.pages[0]?.results.slice(0, 10).map((movie) => (
            <div key={movie.id}>{movie.title}</div>
          ))}
        </div>
      </section>

      <section>
        <h2>Upcoming Movies</h2>
        <div>
          {upcomingMovies.data?.pages[0]?.results.slice(0, 10).map((movie) => (
            <div key={movie.id}>{movie.title}</div>
          ))}
        </div>
      </section>

      <section>
        <h2>Now Playing Movies</h2>
        <div>
          {nowPlayingMovies.data?.pages[0]?.results.slice(0, 10).map((movie) => (
            <div key={movie.id}>{movie.title}</div>
          ))}
        </div>
      </section>

      <section>
        <h2>Popular TV Shows</h2>
        <div>
          {popularTV.data?.pages[0]?.results.slice(0, 10).map((show) => (
            <div key={show.id}>{show.name}</div>
          ))}
        </div>
      </section>

      <section>
        <h2>Top Rated TV Shows</h2>
        <div>
          {topRatedTV.data?.pages[0]?.results.slice(0, 10).map((show) => (
            <div key={show.id}>{show.name}</div>
          ))}
        </div>
      </section>

      <section>
        <h2>On The Air TV Shows</h2>
        <div>
          {onTheAirTV.data?.pages[0]?.results.slice(0, 10).map((show) => (
            <div key={show.id}>{show.name}</div>
          ))}
        </div>
      </section>

      <section>
        <h2>Airing Today TV Shows</h2>
        <div>
          {airingTodayTV.data?.pages[0]?.results.slice(0, 10).map((show) => (
            <div key={show.id}>{show.name}</div>
          ))}
        </div>
      </section>

      <section>
        <h2>Trending (All)</h2>
        <div>
          {trendingAll.data?.pages[0]?.results.slice(0, 10).map((item) => (
            <div key={item.id}>{item.media_type === 'movie' ? item.title : item.name}</div>
          ))}
        </div>
      </section>

      <section>
        <h2>Trending Movies</h2>
        <div>
          {trendingMovies.data?.pages[0]?.results.slice(0, 10).map((movie) => (
            <div key={movie.id}>{'title' in movie ? movie.title : movie.name}</div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
