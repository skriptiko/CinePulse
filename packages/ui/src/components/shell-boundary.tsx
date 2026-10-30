import type { ReactNode } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useLocation } from 'react-router-dom';
import { reportBoundaryError } from '../lib/report-error';
import { Button } from './ui/button';

export type ShellBoundaryProps = {
  children: ReactNode;
};

/**
 * Last-resort boundary of the host, placed inside `AppLayout` so the header survives and
 * navigating away clears the error. Page data errors stop earlier, at `PageBoundary`.
 */
export function ShellBoundary({ children }: ShellBoundaryProps) {
  const { pathname } = useLocation();

  return (
    <ErrorBoundary
      FallbackComponent={ShellErrorFallback}
      onError={reportBoundaryError}
      resetKeys={[pathname]}
    >
      {children}
    </ErrorBoundary>
  );
}

function ShellErrorFallback(_props: FallbackProps) {
  return (
    <section
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 pt-24 text-center"
    >
      <h1 className="text-2xl font-semibold sm:text-3xl">Something went wrong</h1>
      <p className="text-muted-foreground max-w-md">
        The app ran into a problem. Reloading usually fixes it.
      </p>
      <Button onClick={handleReload}>Reload</Button>
    </section>
  );
}

function handleReload(): void {
  window.location.reload();
}
