import { AppRoutes } from '@/app-routes';
import { AppLayout, PageSkeleton, ShellBoundary } from '@repo/ui';
import { Suspense, lazy, useEffect, useState } from 'react';
import type { RouteObject } from 'react-router-dom';
import { OfflineBanner } from './error-channel/offline-banner';

// Toasts only follow a failed background refetch, long after the first render, so sonner
// stays out of the initial bundle.
const Toaster = lazy(() =>
  import('./error-channel/toaster').then((module) => ({ default: module.Toaster }))
);
import { loadRemoteRoutes } from './remotes/load-remote-routes';
import { REMOTES } from './remotes/remotes';

export function App() {
  const [remoteRoutes, setRemoteRoutes] = useState<RouteObject[] | null>(null);

  useEffect(() => {
    // StrictMode runs the effect twice; only the last run may set state.
    let ignore = false;

    void loadRemoteRoutes(REMOTES).then((routes) => {
      if (!ignore) setRemoteRoutes(routes);
    });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    // The shell boundary sits inside AppLayout, so the header survives any page error.
    <AppLayout>
      <ShellBoundary>
        {remoteRoutes === null ? <PageSkeleton /> : <AppRoutes routes={remoteRoutes} />}
      </ShellBoundary>
      <OfflineBanner />
      <Suspense fallback={null}>
        <Toaster />
      </Suspense>
    </AppLayout>
  );
}
