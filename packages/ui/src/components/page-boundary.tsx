import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AsyncBoundary } from './async-boundary';
import { PageSkeleton } from './page-skeletons';

export type PageBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * Wraps each route element of a remote. Navigation resets the error and, because React
 * Router navigates inside a transition, shows the new page's skeleton instead of
 * keeping the old page on screen.
 */
export function PageBoundary({ children, fallback = <PageSkeleton /> }: PageBoundaryProps) {
  const { pathname } = useLocation();

  return (
    <AsyncBoundary fallback={fallback} resetKeys={[pathname]} suspenseKey={pathname}>
      {children}
    </AsyncBoundary>
  );
}
