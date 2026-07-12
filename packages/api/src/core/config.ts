export const API_CONFIG = {
  PROXY_BASE_URL: '/api/tmdb',
  TMDB_IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
} as const;

export type ImageSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original';

export type BackdropSize = 'w300' | 'w780' | 'w1280' | 'original';

export type ProfileSize = 'w45' | 'w185' | 'h632' | 'original';
