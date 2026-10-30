import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface HeaderRule {
  source?: string;
  regex?: string;
  headers: { key: string; value: string }[];
}

const config = JSON.parse(readFileSync(new URL('../../../firebase.json', import.meta.url), 'utf8'));
const rules: HeaderRule[] = config.hosting.headers;

const setsCacheControl = (rule: HeaderRule) => rule.headers.some((h) => h.key === 'Cache-Control');

describe('firebase.json Cache-Control rules', () => {
  // Hosting headers override the ones set by a function, so a catch-all would hide tmdbProxy's.
  it('does not set Cache-Control in the catch-all rule', () => {
    const catchAll = rules.find((rule) => rule.source === '**');

    expect(catchAll).toBeDefined();
    expect(catchAll && setsCacheControl(catchAll)).toBe(false);
  });

  describe('no-cache rule', () => {
    const rule = rules.find((r) => r.regex && setsCacheControl(r));
    const pattern = new RegExp(rule?.regex ?? '^$');

    it.each([
      '/',
      '/movies',
      '/movies/123',
      '/a',
      '/ap',
      '/api',
      '/apix',
      '/about/team',
      '/pages-mfe/movies',
      '/favicon.ico',
    ])('covers %s', (path) => {
      expect(pattern.test(path)).toBe(true);
    });

    it.each(['/api/tmdb/movie/popular', '/api/tmdb', '/api/'])('leaves %s to the proxy', (path) => {
      expect(pattern.test(path)).toBe(false);
    });
  });
});
