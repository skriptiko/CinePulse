import { describe, expect, it } from 'vitest';
import { getErrorMessage } from '../error-message';
import { ApiError } from '../errors';

describe('getErrorMessage', () => {
  it('speaks plainly about connection problems', () => {
    expect(getErrorMessage(new ApiError('network', 'fetch failed'))).toBe(
      'Could not reach the server. Check your connection.'
    );
  });

  it('never shows status codes or raw messages', () => {
    const message = getErrorMessage(new ApiError('server', 'HTTP 503', { status: 503 }));

    expect(message).not.toMatch(/503/);
  });

  it('has a fallback for errors that are not ApiError', () => {
    expect(getErrorMessage(new TypeError('x is undefined'))).toBe(
      'Something went wrong. Please try again.'
    );
  });
});
