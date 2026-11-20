import { type ReactNode, ViewTransition } from 'react';
import { useLocation } from 'react-router-dom';

export type PageTransitionProps = {
  children: ReactNode;
};

/**
 * Animates a change of path inside pages-mfe (DESIGN_APPROACH § Motion): the page cross-fades,
 * and the poster of an opened card morphs into the detail poster (`theme.css`). Only a new path
 * animates; a filter or another page of results updates at once.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const { pathname } = useLocation();

  return (
    <ViewTransition key={pathname} default="none" enter="auto" exit="auto">
      {children}
    </ViewTransition>
  );
}
