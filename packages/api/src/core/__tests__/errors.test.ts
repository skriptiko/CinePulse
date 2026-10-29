import { describe, expect, it } from 'vitest';
import { ApiError, isAbortError, isApiError, isNotFound, toHttpError } from '../errors';

describe('ApiError', () => {
  it('keeps kind, status and cause', () => {
    const cause = new TypeError('Failed to fetch');
    const error = new ApiError('network', 'Network request failed', { cause });

    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ name: 'ApiError', kind: 'network', status: undefined, cause });
  });
});

describe('toHttpError', () => {
  it.each([
    [404, 'not_found'],
    [400, 'client'],
    [401, 'client'],
    [403, 'client'],
    [422, 'client'],
    [429, 'server'],
    [500, 'server'],
    [502, 'server'],
    [503, 'server'],
  ] as const)('classifies status %i as %s', (status, kind) => {
    const error = toHttpError(new Response(null, { status }));

    expect(error).toMatchObject({ kind, status });
  });

  it('puts the status text into the message when there is one', () => {
    expect(
      toHttpError(new Response(null, { status: 503, statusText: 'Unavailable' })).message
    ).toBe('HTTP 503: Unavailable');
    expect(toHttpError(new Response(null, { status: 503 })).message).toBe('HTTP 503');
  });
});

describe('isApiError', () => {
  it('accepts an ApiError', () => {
    expect(isApiError(new ApiError('client', 'Bad request', { status: 400 }))).toBe(true);
  });

  it('accepts an error from another copy of the class (checks the name)', () => {
    const foreign = Object.assign(new Error('HTTP 500'), { name: 'ApiError', kind: 'server' });

    expect(isApiError(foreign)).toBe(true);
  });

  it.each([new Error('boom'), new TypeError('x'), { name: 'ApiError' }, 'ApiError', null])(
    'rejects %j',
    (value) => {
      expect(isApiError(value)).toBe(false);
    }
  );
});

describe('isNotFound', () => {
  it('is true only for the not_found kind', () => {
    expect(isNotFound(new ApiError('not_found', 'HTTP 404', { status: 404 }))).toBe(true);
    expect(isNotFound(new ApiError('client', 'HTTP 400', { status: 400 }))).toBe(false);
    expect(isNotFound(new Error('HTTP 404'))).toBe(false);
  });
});

describe('isAbortError', () => {
  it('recognises an AbortError by name', () => {
    expect(isAbortError(new DOMException('Aborted', 'AbortError'))).toBe(true);
    expect(isAbortError(new ApiError('network', 'Network request failed'))).toBe(false);
  });
});
