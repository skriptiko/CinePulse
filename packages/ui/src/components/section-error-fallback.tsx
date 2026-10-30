import type { FallbackProps } from 'react-error-boundary';
import { Button } from './ui/button';

/** Inline fallback for one section of a page: the rest of the page keeps working. */
export function SectionErrorFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <div
      role="alert"
      className="mx-4 flex flex-col items-start gap-3 rounded-lg border border-border bg-secondary/40 p-6 sm:mx-6 lg:mx-12"
    >
      <p className="text-sm text-muted-foreground">This section could not be loaded.</p>
      <Button variant="outline" size="sm" onClick={resetErrorBoundary}>
        Try again
      </Button>
    </div>
  );
}
