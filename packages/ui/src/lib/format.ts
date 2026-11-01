/** UI copy is English for now; one place to switch when i18n lands. */
const LOCALE = 'en-US';

const ratingFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const DATE_PARTS = { year: 'numeric', month: 'short', day: 'numeric' } as const;

// Calendar dates are rendered in UTC so the day never shifts with the viewer's time zone.
const dateFormatter = new Intl.DateTimeFormat(LOCALE, { ...DATE_PARTS, timeZone: 'UTC' });

// A timestamp is a moment, not a calendar date: it shows the day it was for the viewer.
const timestampFormatter = new Intl.DateTimeFormat(LOCALE, DATE_PARTS);

const TMDB_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses a TMDB calendar date (`YYYY-MM-DD`) into a UTC `Date`.
 * Explicit parsing instead of `new Date(string)`, which accepts many formats
 * and treats some of them as local time. Returns `null` for empty or invalid input.
 */
function parseTmdbDate(value: string | null | undefined): Date | null {
  const match = value ? TMDB_DATE_PATTERN.exec(value) : null;
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Date.UTC rolls over out-of-range parts (2024-02-30 → Mar 1); reject those.
  const isSameDay =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;

  return isSameDay ? date : null;
}

/** `'2024-05-17'` → `'2024'`; `null` when the date is missing or invalid. */
export function formatYear(date: string | null | undefined): string | null {
  const parsed = parseTmdbDate(date);
  return parsed ? String(parsed.getUTCFullYear()) : null;
}

/** `'2024-05-17'` → `'May 17, 2024'`; `null` when the date is missing or invalid. */
export function formatDate(date: string | null | undefined): string | null {
  const parsed = parseTmdbDate(date);
  return parsed ? dateFormatter.format(parsed) : null;
}

/** `'Sat, 31 Oct 2026 08:00:00 GMT'` → `'Oct 31, 2026'`; `null` when missing or invalid. */
export function formatTimestamp(timestamp: string | null | undefined): string | null {
  const parsed = timestamp ? new Date(timestamp) : null;
  return parsed && Number.isFinite(parsed.getTime()) ? timestampFormatter.format(parsed) : null;
}

/**
 * `7.456` → `'7.5'`. `0` is a real rating and formats as `'0.0'`;
 * only a missing (or non-finite) value returns `null`.
 */
export function formatRating(rating: number | null | undefined): string | null {
  if (rating == null || !Number.isFinite(rating)) return null;
  return ratingFormatter.format(rating);
}

/** `'UA'` → `'Ukraine'`; made on call, so a page that never shows a country pays nothing. */
export function formatCountry(code: string): string {
  return new Intl.DisplayNames(LOCALE, { type: 'region' }).of(code) ?? code;
}

/** TMDB sends `''` for missing text. */
export function toOptionalText(text: string | null | undefined): string | null {
  return !text || text.trim() === '' ? null : text;
}

/** `135` → `2h 15m`; `null` when TMDB does not know the runtime (it may also send 0). */
export function formatRuntime(minutes: number | null | undefined): string | null {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** `24` → `24 episodes`; `null` when TMDB does not know the count (it may also send 0). */
function formatCount(count: number | null | undefined, noun: string): string | null {
  if (!count) return null;
  return `${count.toLocaleString(LOCALE)} ${noun}${count === 1 ? '' : 's'}`;
}

export function formatEpisodeCount(count: number | null | undefined): string | null {
  return formatCount(count, 'episode');
}

/** `3, 24` → `3 seasons, 24 episodes`; `null` when TMDB knows neither count. */
export function formatShowLength(
  seasons: number | null | undefined,
  episodes: number | null | undefined
): string | null {
  const counts = [formatCount(seasons, 'season'), formatEpisodeCount(episodes)];
  return counts.filter((count) => count !== null).join(', ') || null;
}
