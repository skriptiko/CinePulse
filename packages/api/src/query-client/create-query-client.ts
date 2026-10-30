import { createTypedEmitter } from '@repo/events';
import { MutationCache, type Query, QueryCache, QueryClient } from '@tanstack/react-query';
import { getErrorMessage, isApiError, isNotFound } from '../core';
import { STALE_TIME_DEFAULT_MS } from '../queries';

/** Retries after the first failure; three requests at most. */
export const MAX_RETRIES = 2;

const emitErrorReport = createTypedEmitter('error:report');
const emitNotification = createTypedEmitter('notification:show');

/**
 * The one `QueryClient` of the app. Only the host creates it (and each remote's standalone
 * `main.tsx`); integrated remotes share the host's cache.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({ onError: handleQueryError }),
    mutationCache: new MutationCache({ onError: handleMutationError }),
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

/**
 * Runs once per failed query, after the last retry. Without data the error is thrown to the
 * nearest boundary, so a toast would show it twice; it is shown only over existing data.
 */
function handleQueryError(error: unknown, query: Query<unknown, unknown, unknown>): void {
  emitErrorReport({ error, source: 'query' });

  const hasData = query.state.data !== undefined;
  const isShownElsewhere = query.meta?.inlineErrors === true || isNotFound(error);
  if (hasData && !isShownElsewhere) {
    emitNotification({
      type: 'error',
      message: query.meta?.errorMessage ?? getErrorMessage(error),
    });
  }
}

/** Mutations have no boundary: every failure is a toast. */
function handleMutationError(error: unknown): void {
  emitErrorReport({ error, source: 'mutation' });
  emitNotification({ type: 'error', message: getErrorMessage(error) });
}
