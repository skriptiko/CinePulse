import { describe, expect, it } from 'vitest';
import { toHttpsUrl } from '../https-url';

describe('toHttpsUrl', () => {
  it('keeps an https URL as it is', () => {
    const url = 'https://www.themoviedb.org/movie/1/watch?locale=US';

    expect(toHttpsUrl(url)).toBe(url);
  });

  it.each([
    ['http', 'http://example.com'],
    ['javascript', 'javascript:alert(1)'],
    ['data', 'data:text/html,<script>alert(1)</script>'],
    ['a relative path', '/review/1'],
    ['an empty string', ''],
  ])('drops %s', (_label, url) => {
    expect(toHttpsUrl(url)).toBeNull();
  });

  it('drops a missing value', () => {
    expect(toHttpsUrl(undefined)).toBeNull();
    expect(toHttpsUrl(null)).toBeNull();
  });
});
