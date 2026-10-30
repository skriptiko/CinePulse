import { describe, expect, it } from 'vitest';
import { buildQueryString, getImageUrl } from '../utils';

describe('buildQueryString', () => {
  it('returns an empty string when there are no params', () => {
    expect(buildQueryString({})).toBe('');
  });

  it('skips undefined values and stringifies the rest', () => {
    expect(buildQueryString({ page: 2, query: undefined, include_adult: false })).toBe(
      '?page=2&include_adult=false'
    );
  });

  it('encodes reserved characters', () => {
    expect(buildQueryString({ query: 'tom & jerry' })).toBe('?query=tom+%26+jerry');
  });
});

describe('getImageUrl', () => {
  it('uses the requested size', () => {
    expect(getImageUrl('/abc.jpg', 'original')).toBe('https://image.tmdb.org/t/p/original/abc.jpg');
  });

  it.each([null, undefined, ''])('returns null when the path is %j', (path) => {
    expect(getImageUrl(path, 'w500')).toBeNull();
  });
});
