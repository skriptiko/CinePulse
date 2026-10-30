import { POSTER_SIZE_CARD, getImageUrl } from '@repo/api';
import type { Movie, TV, TrendingMovie, TrendingTV } from '@repo/api';
import type { MovieCardData } from '../../components/movie-card';
import { formatRating, formatYear } from '../format';

export function toMovieCardData(movie: Movie): MovieCardData {
  return {
    id: movie.id,
    title: movie.title,
    imageUrl: getImageUrl(movie.poster_path, POSTER_SIZE_CARD),
    year: formatYear(movie.release_date),
    rating: formatRating(movie.vote_average),
  };
}

export function toTvCardData(tv: TV): MovieCardData {
  return {
    id: tv.id,
    title: tv.name,
    imageUrl: getImageUrl(tv.poster_path, POSTER_SIZE_CARD),
    year: formatYear(tv.first_air_date),
    rating: formatRating(tv.vote_average),
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
