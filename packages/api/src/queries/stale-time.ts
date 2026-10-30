/** Lists and details: TMDB data changes slowly, and every request costs a proxy call. */
export const STALE_TIME_DEFAULT_MS = 5 * 60 * 1000;

/** Reference data (genres) does not change during a session. */
export const STALE_TIME_REFERENCE = Number.POSITIVE_INFINITY;
