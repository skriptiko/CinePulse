import { describe, expect, it } from 'vitest';
import { buildPath } from '../index';

describe('buildPath', () => {
  it('fills the id into each dynamic route', () => {
    expect(buildPath.movie(42)).toBe('/movies/42');
    expect(buildPath.tv(7)).toBe('/tv/7');
    expect(buildPath.person(1)).toBe('/person/1');
  });
});
