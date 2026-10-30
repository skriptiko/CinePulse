import { ApiError, getErrorMessage, isApiError } from '@repo/api';

const NETWORK_FAILURE_CODE = 'auth/network-request-failed';
const POPUP_BLOCKED_CODE = 'auth/popup-blocked';

/** `FirebaseError` by shape: the SDK is loaded lazily, so its class is not at hand here. */
export function getFirebaseCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null;
  return typeof error.code === 'string' ? error.code : null;
}

/** Boundaries, toasts and the error report only know `ApiError`. */
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;

  const code = getFirebaseCode(error);
  const kind = code === NETWORK_FAILURE_CODE ? 'network' : 'client';
  return new ApiError(kind, code ?? 'Firebase request failed', { cause: error });
}

export function getSignInErrorMessage(error: unknown): string {
  const isPopupBlocked = isApiError(error) && getFirebaseCode(error.cause) === POPUP_BLOCKED_CODE;
  return isPopupBlocked ? 'Allow pop-ups for this site and try again.' : getErrorMessage(error);
}
