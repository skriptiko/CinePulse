import { ApiError, type ApiErrorKind, getErrorMessage, isApiError } from '@repo/api';

/** Firestore Lite reports a failed `fetch` as `unknown`, the same code as an HTTP 500. */
const NETWORK_FAILURE_CODES = [
  'auth/network-request-failed',
  'unknown',
  'unavailable',
  'deadline-exceeded',
];
/** Firestore's HTTP 429, which `shouldRetry` treats like a 5xx. */
const RATE_LIMIT_CODE = 'resource-exhausted';
const POPUP_BLOCKED_CODE = 'auth/popup-blocked';

/** `FirebaseError` by shape: the SDK is loaded lazily, so its class is not at hand here. */
export function getFirebaseCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null;
  return typeof error.code === 'string' ? error.code : null;
}

function getErrorKind(code: string | null): ApiErrorKind {
  if (code === RATE_LIMIT_CODE) return 'server';
  return NETWORK_FAILURE_CODES.includes(code ?? '') ? 'network' : 'client';
}

/** Boundaries, toasts and the error report only know `ApiError`. */
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;

  const code = getFirebaseCode(error);
  return new ApiError(getErrorKind(code), code ?? 'Firebase request failed', { cause: error });
}

export function getSignInErrorMessage(error: unknown): string {
  const isPopupBlocked = isApiError(error) && getFirebaseCode(error.cause) === POPUP_BLOCKED_CODE;
  return isPopupBlocked ? 'Allow pop-ups for this site and try again.' : getErrorMessage(error);
}
