import { describe, expect, it } from 'vitest';
import {
  formatCountry,
  formatDate,
  formatEpisodeCount,
  formatRating,
  formatRuntime,
  formatShowLength,
  formatTimestamp,
  formatYear,
  toOptionalText,
} from '../format';

describe('formatCountry', () => {
  it('names a country in the language of the UI', () => {
    expect(formatCountry('UA')).toBe('Ukraine');
    expect(formatCountry('US')).toBe('United States');
  });
});

describe('toOptionalText', () => {
  it('keeps text', () => {
    expect(toOptionalText('Chani')).toBe('Chani');
  });

  it.each(['', '   ', null, undefined])('turns %j into null', (text) => {
    expect(toOptionalText(text)).toBeNull();
  });
});

describe('formatRuntime', () => {
  it('splits minutes into hours and minutes', () => {
    expect(formatRuntime(135)).toBe('2h 15m');
    expect(formatRuntime(120)).toBe('2h');
    expect(formatRuntime(45)).toBe('45m');
  });

  it('hides an unknown runtime', () => {
    expect(formatRuntime(null)).toBeNull();
    expect(formatRuntime(0)).toBeNull();
  });
});

describe('formatEpisodeCount', () => {
  it('counts episodes, with a correct singular', () => {
    expect(formatEpisodeCount(1)).toBe('1 episode');
    expect(formatEpisodeCount(24)).toBe('24 episodes');
    expect(formatEpisodeCount(10_500)).toBe('10,500 episodes');
  });

  it('hides an unknown count', () => {
    expect(formatEpisodeCount(0)).toBeNull();
    expect(formatEpisodeCount(undefined)).toBeNull();
  });
});

describe('formatShowLength', () => {
  it('counts seasons and episodes, with correct singulars', () => {
    expect(formatShowLength(3, 24)).toBe('3 seasons, 24 episodes');
    expect(formatShowLength(1, 8)).toBe('1 season, 8 episodes');
    expect(formatShowLength(1, 1)).toBe('1 season, 1 episode');
  });

  it('leaves out a count TMDB does not know', () => {
    expect(formatShowLength(2, 0)).toBe('2 seasons');
    expect(formatShowLength(0, 6)).toBe('6 episodes');
    expect(formatShowLength(0, 0)).toBeNull();
    expect(formatShowLength(undefined, undefined)).toBeNull();
  });
});

describe('formatYear', () => {
  it('takes the year from a TMDB date', () => {
    expect(formatYear('2024-05-17')).toBe('2024');
  });

  it('does not shift New Year dates across time zones', () => {
    expect(formatYear('2024-01-01')).toBe('2024');
    expect(formatYear('2023-12-31')).toBe('2023');
  });

  it.each([null, undefined, '', '2024', '17/05/2024', '2024-02-30', '2024-13-01'])(
    'returns null for missing or invalid %j',
    (value) => {
      expect(formatYear(value)).toBeNull();
    }
  );
});

describe('formatDate', () => {
  it('formats a TMDB date as a short calendar date', () => {
    expect(formatDate('2024-05-17')).toBe('May 17, 2024');
  });

  it('keeps the calendar day at the edges of the year', () => {
    expect(formatDate('2024-01-01')).toBe('Jan 1, 2024');
    expect(formatDate('2023-12-31')).toBe('Dec 31, 2023');
  });

  it('accepts a leap day and rejects an impossible one', () => {
    expect(formatDate('2024-02-29')).toBe('Feb 29, 2024');
    expect(formatDate('2023-02-29')).toBeNull();
  });

  it.each([null, undefined, ''])('returns null for %j', (value) => {
    expect(formatDate(value)).toBeNull();
  });
});

describe('formatRating', () => {
  it('rounds to one decimal', () => {
    expect(formatRating(7.456)).toBe('7.5');
    expect(formatRating(8)).toBe('8.0');
  });

  it('keeps 0 as a real rating', () => {
    expect(formatRating(0)).toBe('0.0');
  });

  it.each([null, undefined, Number.NaN, Number.POSITIVE_INFINITY])(
    'returns null for %j',
    (value) => {
      expect(formatRating(value)).toBeNull();
    }
  );
});

describe('formatTimestamp', () => {
  it('renders the day of the viewer, as a timestamp is a moment', () => {
    expect(formatTimestamp('Sun, 01 Nov 2026 03:00:00 GMT')).toBe('Oct 31, 2026');
  });

  it('hides a missing or invalid timestamp', () => {
    expect(formatTimestamp(null)).toBeNull();
    expect(formatTimestamp('')).toBeNull();
    expect(formatTimestamp('not a date')).toBeNull();
  });
});
