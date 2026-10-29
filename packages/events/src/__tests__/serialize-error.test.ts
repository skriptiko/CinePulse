import { describe, expect, it } from 'vitest';
import { serializeError } from '../serialize-error';

describe('serializeError', () => {
  it('keeps the name and message of an Error', () => {
    expect(serializeError(new TypeError('Failed to fetch'))).toEqual({
      name: 'TypeError',
      message: 'Failed to fetch',
    });
  });

  it('stringifies a thrown non-error', () => {
    expect(serializeError('timeout')).toEqual({ name: 'Error', message: 'timeout' });
  });

  it('returns plain data that survives structuredClone', () => {
    const serialized = serializeError(new Error('boom', { cause: new Error('inner') }));

    expect(structuredClone(serialized)).toEqual(serialized);
  });
});
