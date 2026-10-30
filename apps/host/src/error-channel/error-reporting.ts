import { isAbortError, isApiError, isNotFound } from '@repo/api';
import { createTypedEmitter, createTypedListener } from '@repo/events';
import { onlineManager } from '@tanstack/react-query';

const emitErrorReport = createTypedEmitter('error:report');
const onErrorReport = createTypedListener('error:report');
const onMfeError = createTypedListener('mfe:error');

/**
 * The only `error:report` and `mfe:error` listener, plus global handlers for errors nothing else caught.
 * No reporting vendor is chosen yet, so reports go to the console in development only.
 */
export function startErrorReporting(): () => void {
  const stopErrorReports = onErrorReport(({ error, source }) => {
    if (!shouldReport(error)) return;
    if (import.meta.env.DEV) {
      console.error(`[error:report] ${source}`, error);
    }
  });
  const stopMfeErrors = onMfeError(({ name, error }) => {
    if (import.meta.env.DEV) {
      console.error(`[mfe:error] ${name}`, error);
    }
  });

  window.addEventListener('error', handleWindowError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  return () => {
    stopErrorReports();
    stopMfeErrors();
    window.removeEventListener('error', handleWindowError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  };
}

/** Expected failures are not bugs: a 404, a cancelled request, a network error while offline. */
export function shouldReport(error: unknown): boolean {
  if (isNotFound(error) || isAbortError(error)) return false;
  const isOfflineFailure =
    isApiError(error) && error.kind === 'network' && !onlineManager.isOnline();
  return !isOfflineFailure;
}

function handleWindowError(event: ErrorEvent): void {
  emitErrorReport({ error: event.error ?? event.message, source: 'window' });
}

function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  emitErrorReport({ error: event.reason, source: 'window' });
}
