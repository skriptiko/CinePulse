/** UI copy is English for now; one place to switch when i18n lands. */
const LOCALE = 'en-US';

const ratingFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

// Calendar dates are rendered in UTC so the day never shifts with the viewer's time zone.
const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

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

/**
 * `7.456` → `'7.5'`. `0` is a real rating and formats as `'0.0'`;
 * only a missing (or non-finite) value returns `null`.
 */
export function formatRating(rating: number | null | undefined): string | null {
  if (rating == null || !Number.isFinite(rating)) return null;
  return ratingFormatter.format(rating);
}

/** `135` → `2h 15m`; `null` when TMDB does not know the runtime (it may also send 0). */
export function formatRuntime(minutes: number | null | undefined): string | null {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
