import { isApiError, isNotFound } from '@repo/api';
import type { FallbackProps } from 'react-error-boundary';
import { usePageMeta } from '../hooks/use-page-meta';
import { NotFound } from './not-found';
import { Button } from './ui/button';

/** Page-level fallback: 404 becomes NotFound, anything else a generic error with Retry. */
export function PageErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  if (isNotFound(error)) return <NotFound />;

  return <PageError error={error} onRetry={resetErrorBoundary} />;
}

type PageErrorProps = {
  error: unknown;
  onRetry: () => void;
};

function PageError({ error, onRetry }: PageErrorProps) {
  usePageMeta('Something went wrong');

  return (
    <section
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 pt-24 text-center"
    >
      <h1 className="text-2xl font-semibold sm:text-3xl">Something went wrong</h1>
      <p className="text-muted-foreground max-w-md">{getFallbackMessage(error)}</p>
      <Button onClick={onRetry}>Try again</Button>
    </section>
  );
}

// Plain words only: the raw `error.message` is for developers, not for users.
function getFallbackMessage(error: unknown): string {
  if (isApiError(error) && error.kind === 'network') {
    return 'We could not reach the server. Check your connection and try again.';
  }
  return 'We could not load this page. Please try again.';
}
