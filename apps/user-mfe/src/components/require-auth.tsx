import { useGlobalStore } from '@repo/events';
import { ROUTE_PATHS } from '@repo/routes';
import { PageSkeleton } from '@repo/ui';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export type RequireAuthProps = {
  children: ReactNode;
};

/** Sends an anonymous visitor to the login page, which brings them back afterwards. */
export function RequireAuth({ children }: RequireAuthProps) {
  const authStatus = useGlobalStore((state) => state.authStatus);
  const { pathname } = useLocation();

  if (authStatus === 'loading') return <PageSkeleton />;
  if (authStatus === 'anonymous') {
    return <Navigate to={ROUTE_PATHS.AUTH_LOGIN} state={{ from: pathname }} replace />;
  }
  return children;
}
