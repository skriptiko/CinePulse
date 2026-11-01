import { describe, expect, it } from 'vitest';
import { uniqueById } from '../unique-by-id';

describe('uniqueById', () => {
  it('keeps the first copy of each id, in order', () => {
    const items = [
      { id: 2, name: 'first' },
      { id: 1, name: 'second' },
      { id: 2, name: 'copy' },
    ];

    expect(uniqueById(items)).toEqual([
      { id: 2, name: 'first' },
      { id: 1, name: 'second' },
    ]);
  });

  it('takes an empty list', () => {
    expect(uniqueById([])).toEqual([]);
  });
});
