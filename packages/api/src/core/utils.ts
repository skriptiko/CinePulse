import { API_CONFIG, type BackdropSize, type ImageSize, type ProfileSize } from './config';

export function getImageUrl(
  path: string | null | undefined,
  size: ImageSize | BackdropSize | ProfileSize = 'w500'
): string | null {
  if (!path) return null;
  return `${API_CONFIG.TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

export function buildQueryString(
  params: Record<string, string | number | boolean | undefined>
): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  }
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}
