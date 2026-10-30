import type { Movie } from '@repo/api';
import { BACKDROP_SIZE_FEATURED, BACKDROP_SIZE_HERO, getImageUrl } from '@repo/api';
import type { HeroData } from '../../components/hero';
import { formatRating, formatYear } from '../format';

export function toHeroData(movie: Movie): HeroData {
  return {
    id: movie.id,
    title: movie.title,
    // TMDB sends '' when there is no overview.
    description: movie.overview.trim() === '' ? null : movie.overview,
    imageUrl: getImageUrl(movie.backdrop_path, BACKDROP_SIZE_HERO),
    imageSrcSet: toBackdropSrcSet(movie.backdrop_path),
    year: formatYear(movie.release_date),
    rating: formatRating(movie.vote_average),
  };
}

/** w780 for phones and tablets, w1280 for larger screens; the browser picks by width. */
function toBackdropSrcSet(path: string | null): string | null {
  const smallUrl = getImageUrl(path, BACKDROP_SIZE_FEATURED);
  const largeUrl = getImageUrl(path, BACKDROP_SIZE_HERO);
  if (smallUrl === null || largeUrl === null) return null;
  return `${smallUrl} 780w, ${largeUrl} 1280w`;
}
