import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '../core';
import { STALE_TIME_DEFAULT_MS } from '../queries';

/** Retries after the first failure; three requests at most. */
export const MAX_RETRIES = 2;

/**
 * The one `QueryClient` of the app. Only the host creates it (and each remote's standalone
 * `main.tsx`); integrated remotes share the host's cache.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_DEFAULT_MS,
        refetchOnWindowFocus: false,
        retry: shouldRetry,
      },
    },
  });
}

/**
 * Retries only what can succeed on a second try: network failures, 5xx and 429.
 * Other 4xx, invalid JSON, aborts and programming errors fail at once.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  if (!isApiError(error)) return false;

  switch (error.kind) {
    case 'network':
    case 'server':
      return true;
    case 'not_found':
    case 'client':
    case 'validation':
      return false;
    default: {
      const unhandled: never = error.kind;
      return unhandled;
    }
  }
}
