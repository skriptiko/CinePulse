/** The TMDB id in a dynamic path; `null` when it is not a positive integer. */
export function parseRouteId(id: string | undefined): number | null {
  return id !== undefined && /^[1-9]\d*$/.test(id) ? Number(id) : null;
}
