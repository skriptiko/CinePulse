import { AsyncBoundary, SectionErrorFallback } from '@repo/ui';
import type { ReactNode } from 'react';
import type { FallbackProps } from 'react-error-boundary';

/** Home sections run edge to edge, so the message takes the page gutter itself. */
function HomeSectionError({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="mx-4 sm:mx-6 lg:mx-12">
      <SectionErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
    </div>
  );
}

type SectionBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

/** A Home section loads and fails on its own; its error never blanks the page. */
export function SectionBoundary({ children, fallback }: SectionBoundaryProps) {
  return (
    <AsyncBoundary fallback={fallback} errorFallback={HomeSectionError}>
      {children}
    </AsyncBoundary>
  );
}
