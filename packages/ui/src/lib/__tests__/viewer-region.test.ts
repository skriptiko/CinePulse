import { afterEach, describe, expect, it, vi } from 'vitest';
import { getViewerRegion } from '../viewer-region';

function setLanguage(language: string) {
  vi.spyOn(navigator, 'language', 'get').mockReturnValue(language);
}

describe('getViewerRegion', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ['uk-UA', 'UA'],
    ['en-gb', 'GB'],
    ['zh-Hant-TW', 'TW'],
  ])('reads the region of %s', (language, region) => {
    setLanguage(language);

    expect(getViewerRegion()).toBe(region);
  });

  it.each(['uk', 'en', '', 'not a locale'])('falls back to US for "%s"', (language) => {
    setLanguage(language);

    expect(getViewerRegion()).toBe('US');
  });
});
