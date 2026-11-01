import { describe, expect, it } from 'vitest';
import { parseRouteId } from '../parse-route-id';

describe('parseRouteId', () => {
  it('reads a positive integer', () => {
    expect(parseRouteId('1')).toBe(1);
    expect(parseRouteId('95396')).toBe(95396);
  });

  it.each([
    ['no value', undefined],
    ['an empty value', ''],
    ['zero', '0'],
    ['a negative number', '-1'],
    ['a fraction', '1.5'],
    ['leading zeros', '007'],
    ['an exponent', '1e3'],
    ['letters', 'abc'],
    ['a number with text after it', '42-the-answer'],
  ])('refuses %s', (_label, id) => {
    expect(parseRouteId(id)).toBeNull();
  });
});
