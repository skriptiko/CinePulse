import { getImageUrl } from '@repo/api';
import type { Movie, SearchMovie, TV, TrendingMovie, TrendingTV } from '@repo/api';

/**
 * Maps TMDB movie/TV data to MovieCard props
 */
export function mapTmdbToMovieCard(movie: Movie | SearchMovie | TrendingMovie | TV | TrendingTV) {
  const title = 'title' in movie ? movie.title : 'name' in movie ? movie.name : 'Unknown';
  const year =
    'release_date' in movie && movie.release_date
      ? movie.release_date.split('-')[0]
      : 'first_air_date' in movie && movie.first_air_date
        ? movie.first_air_date.split('-')[0]
        : '';

  return {
    title,
    imageUrl: getImageUrl(movie.poster_path, 'w500') || '',
    year,
    rating: movie.vote_average ? movie.vote_average.toFixed(1) : undefined,
    // Note: duration is not directly available in list responses,
    // it requires movie details call. For lists we can skip it or show rating.
  };
}
