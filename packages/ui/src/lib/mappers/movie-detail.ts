import type { MovieDetails, TVDetails } from '@repo/api';
import { BACKDROP_SIZE_HERO, getImageUrl, POSTER_SIZE_CARD } from '@repo/api';
import type { MovieDetailData } from '../../components/movie-detail-view';
import {
  formatRating,
  formatRuntime,
  formatShowLength,
  formatYear,
  toOptionalText,
} from '../format';
import { toBackdropSrcSet } from './hero';

type SharedDetailFields = Pick<
  MovieDetails,
  'overview' | 'poster_path' | 'backdrop_path' | 'vote_average' | 'genres' | 'tagline'
>;

type MovieDetailFields = SharedDetailFields &
  Pick<MovieDetails, 'title' | 'release_date' | 'runtime'>;

type TvDetailFields = SharedDetailFields &
  Pick<TVDetails, 'name' | 'first_air_date' | 'number_of_seasons' | 'number_of_episodes'>;

function toSharedDetailData(title: SharedDetailFields) {
  return {
    tagline: toOptionalText(title.tagline),
    description: toOptionalText(title.overview),
    posterUrl: getImageUrl(title.poster_path, POSTER_SIZE_CARD),
    backdropUrl: getImageUrl(title.backdrop_path, BACKDROP_SIZE_HERO),
    backdropSrcSet: toBackdropSrcSet(title.backdrop_path),
    rating: formatRating(title.vote_average),
    genres: title.genres.map((genre) => genre.name),
  };
}

export function toMovieDetailData(movie: MovieDetailFields): MovieDetailData {
  return {
    ...toSharedDetailData(movie),
    title: movie.title,
    year: formatYear(movie.release_date),
    duration: formatRuntime(movie.runtime),
  };
}

export function toTvDetailData(tv: TvDetailFields): MovieDetailData {
  return {
    ...toSharedDetailData(tv),
    title: tv.name,
    year: formatYear(tv.first_air_date),
    duration: formatShowLength(tv.number_of_seasons, tv.number_of_episodes),
  };
}
