import type { Genre, Movie } from '@repo/api';
import { BACKDROP_SIZE_FEATURED, getImageUrl } from '@repo/api';
import { buildPath } from '@repo/routes';
import type { FeaturedItemData } from '../../components/featured-grid';
import { formatRating, formatYear } from '../format';

/** `genres` is the TMDB genre list; the item shows the first of the movie's genres found in it. */
export function toFeaturedItemData(movie: Movie, genres: Genre[]): FeaturedItemData {
  const genre = movie.genre_ids
    .map((genreId) => genres.find((candidate) => candidate.id === genreId))
    .find((candidate) => candidate !== undefined);

  return {
    id: movie.id,
    title: movie.title,
    imageUrl: getImageUrl(movie.backdrop_path, BACKDROP_SIZE_FEATURED),
    year: formatYear(movie.release_date),
    rating: formatRating(movie.vote_average),
    genre: genre?.name ?? null,
    href: buildPath.movie(movie.id),
  };
}
