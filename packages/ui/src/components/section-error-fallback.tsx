import type { FallbackProps } from 'react-error-boundary';
import { Button } from './ui/button';

/** Inline fallback for one section of a page: the rest of the page keeps working. */
export function SectionErrorFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <div
      role="alert"
      className="border-border bg-secondary/40 flex flex-col items-start gap-3 rounded-lg border p-6"
    >
      <p className="text-muted-foreground text-sm">This section could not be loaded.</p>
      <Button variant="outline" size="sm" className="touch-target" onClick={resetErrorBoundary}>
        Try again
      </Button>
    </div>
  );
}
