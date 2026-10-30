import type { MovieDetails } from '@repo/api';
import { BACKDROP_SIZE_HERO, getImageUrl, POSTER_SIZE_CARD } from '@repo/api';
import type { MovieDetailData } from '../../components/movie-detail-view';
import { formatRating, formatRuntime, formatYear } from '../format';
import { toBackdropSrcSet } from './hero';

type MovieDetailFields = Pick<
  MovieDetails,
  | 'title'
  | 'overview'
  | 'poster_path'
  | 'backdrop_path'
  | 'release_date'
  | 'vote_average'
  | 'genres'
  | 'runtime'
  | 'tagline'
>;

export function toMovieDetailData(movie: MovieDetailFields): MovieDetailData {
  return {
    title: movie.title,
    tagline: toOptionalText(movie.tagline),
    description: toOptionalText(movie.overview),
    posterUrl: getImageUrl(movie.poster_path, POSTER_SIZE_CARD),
    backdropUrl: getImageUrl(movie.backdrop_path, BACKDROP_SIZE_HERO),
    backdropSrcSet: toBackdropSrcSet(movie.backdrop_path),
    year: formatYear(movie.release_date),
    rating: formatRating(movie.vote_average),
    runtime: formatRuntime(movie.runtime),
    genres: movie.genres.map((genre) => genre.name),
  };
}

// TMDB sends '' for missing text.
function toOptionalText(text: string | null): string | null {
  return text === null || text.trim() === '' ? null : text;
}
