/** A link from TMDB is external data: anything but https never reaches an `href`. */
export function toHttpsUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}
