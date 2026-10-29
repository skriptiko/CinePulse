export const API_CONFIG = {
  PROXY_BASE_URL: '/api/tmdb',
  TMDB_IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
} as const;

export type ImageSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original';

export type BackdropSize = 'w300' | 'w780' | 'w1280' | 'original';

export type ProfileSize = 'w45' | 'w185' | 'h632' | 'original';

/** Poster in a `MovieCard` (rendered at most ~200px wide, so w342 covers 1.5x DPR). */
export const POSTER_SIZE_CARD = 'w342' satisfies ImageSize;

/** Backdrop in a `FeaturedGrid` tile. */
export const BACKDROP_SIZE_FEATURED = 'w780' satisfies BackdropSize;

/** Full-bleed backdrop in the `Hero`. */
export const BACKDROP_SIZE_HERO = 'w1280' satisfies BackdropSize;
