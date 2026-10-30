import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { type ComponentType, type ReactNode, Suspense } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { reportBoundaryError } from '../lib/report-error';
import { PageErrorFallback } from './page-error-fallback';

export type AsyncBoundaryProps = {
  children: ReactNode;
  /** Shown while the children suspend: a skeleton shaped like the content. */
  fallback: ReactNode;
  errorFallback?: ComponentType<FallbackProps>;
  /** A change resets the error state, e.g. `[pathname]`. */
  resetKeys?: unknown[];
  /** A new key shows the fallback again instead of keeping stale content during a transition. */
  suspenseKey?: string;
};

/**
 * Loading and error boundary for a page or an independent section. Retry also resets the
 * failed queries, so they refetch instead of rethrowing the cached error.
 */
export function AsyncBoundary({
  children,
  fallback,
  errorFallback = PageErrorFallback,
  resetKeys,
  suspenseKey,
}: AsyncBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          FallbackComponent={errorFallback}
          onError={reportBoundaryError}
          onReset={reset}
          resetKeys={resetKeys}
        >
          <Suspense key={suspenseKey} fallback={fallback}>
            {children}
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
