import type { Movie, TrendingMovie, TrendingTV, TV } from '@repo/api';
import { getImageUrl, POSTER_SIZE_CARD } from '@repo/api';
import { buildPath } from '@repo/routes';
import type { MovieCardData } from '../../components/movie-card';
import { formatRating, formatYear } from '../format';

/** What TMDB can leave out of a credit is optional here (ADR-0012). */
type MovieCardFields = Pick<Movie, 'id' | 'title'> &
  Partial<Pick<Movie, 'poster_path' | 'release_date' | 'vote_average'>>;
type TvCardFields = Pick<TV, 'id' | 'name'> &
  Partial<Pick<TV, 'poster_path' | 'first_air_date' | 'vote_average'>>;

export function toMovieCardData(movie: MovieCardFields): MovieCardData {
  return {
    id: movie.id,
    title: movie.title,
    mediaType: 'movie',
    posterPath: movie.poster_path ?? null,
    imageUrl: getImageUrl(movie.poster_path, POSTER_SIZE_CARD),
    year: formatYear(movie.release_date),
    rating: formatRating(movie.vote_average),
    href: buildPath.movie(movie.id),
  };
}

export function toTvCardData(tv: TvCardFields): MovieCardData {
  return {
    id: tv.id,
    title: tv.name,
    mediaType: 'tv',
    posterPath: tv.poster_path ?? null,
    imageUrl: getImageUrl(tv.poster_path, POSTER_SIZE_CARD),
    year: formatYear(tv.first_air_date),
    rating: formatRating(tv.vote_average),
    // No TV details page yet (CIN-17).
    href: null,
  };
}

/** Maps a trending item of either media type; people are not cards and must be filtered out first. */
export function toTrendingCardData(item: TrendingMovie | TrendingTV): MovieCardData {
  switch (item.media_type) {
    case 'movie':
      return toMovieCardData(item);
    case 'tv':
      return toTvCardData(item);
    default: {
      const unhandled: never = item;
      throw new Error(`Unhandled media type: ${JSON.stringify(unhandled)}`);
    }
  }
}
