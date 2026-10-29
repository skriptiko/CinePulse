import { BACKDROP_SIZE_HERO, getImageUrl } from '@repo/api';
import type { Movie } from '@repo/api';
import type { HeroData } from '../../components/hero';
import { formatRating, formatYear } from '../format';

export function toHeroData(movie: Movie): HeroData {
  return {
    id: movie.id,
    title: movie.title,
    // TMDB sends '' when there is no overview.
    description: movie.overview.trim() === '' ? null : movie.overview,
    imageUrl: getImageUrl(movie.backdrop_path, BACKDROP_SIZE_HERO),
    year: formatYear(movie.release_date),
    rating: formatRating(movie.vote_average),
  };
}
