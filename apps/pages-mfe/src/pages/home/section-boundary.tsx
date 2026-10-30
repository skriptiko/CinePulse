import { AsyncBoundary, SectionErrorFallback } from '@repo/ui';
import type { ReactNode } from 'react';

type SectionBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

/** A Home section loads and fails on its own; its error never blanks the page. */
export function SectionBoundary({ children, fallback }: SectionBoundaryProps) {
  return (
    <AsyncBoundary fallback={fallback} errorFallback={SectionErrorFallback}>
      {children}
    </AsyncBoundary>
  );
}
