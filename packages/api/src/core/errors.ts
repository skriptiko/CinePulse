/**
 * Every failure of a request is normalised into one `ApiError` with a `kind` discriminator.
 * An `AbortError` is not an `ApiError`: the transport rethrows it unchanged.
 */
export type ApiErrorKind = 'network' | 'not_found' | 'server' | 'client' | 'validation';

export type ApiErrorOptions = {
  /** HTTP status, set only for errors built from a response. */
  status?: number;
  /** The original error (fetch `TypeError`, JSON `SyntaxError`, ...). */
  cause?: unknown;
};

export class ApiError extends Error {
  override readonly name = 'ApiError';
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(kind: ApiErrorKind, message: string, { status, cause }: ApiErrorOptions = {}) {
    super(message, { cause });
    this.kind = kind;
    this.status = status;
  }
}

/** Checks `name`, not only `instanceof`, so it holds across separate MFE bundles of the package. */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && error.name === 'ApiError';
}

export function isNotFound(error: unknown): boolean {
  return isApiError(error) && error.kind === 'not_found';
}

/** By `name` only: a `DOMException` is not an `Error` instance in every environment. */
export function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError'
  );
}

/** Builds the error for a non-OK response. */
export function toHttpError(response: Response): ApiError {
  const { status, statusText } = response;
  const message = statusText ? `HTTP ${status}: ${statusText}` : `HTTP ${status}`;
  return new ApiError(getHttpErrorKind(status), message, { status });
}

function getHttpErrorKind(status: number): ApiErrorKind {
  if (status === HTTP_NOT_FOUND) return 'not_found';
  if (status === HTTP_TOO_MANY_REQUESTS || status >= HTTP_SERVER_ERROR_MIN) return 'server';
  return 'client';
}

const HTTP_NOT_FOUND = 404;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_SERVER_ERROR_MIN = 500;
