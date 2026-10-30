import { AppRoutes } from '@/app-routes';
import { AppLayout, PageSkeleton, ShellBoundary } from '@repo/ui';
import { useEffect, useState } from 'react';
import type { RouteObject } from 'react-router-dom';

export function App() {
  const [remoteRoutes, setRemoteRoutes] = useState<RouteObject[] | null>(null);

  useEffect(() => {
    async function loadRemoteRoutes() {
      // allSettled: one unavailable remote must not drop the other's routes.
      const results = await Promise.allSettled([
        import('pagesMfe/routes'),
        import('userMfe/routes'),
      ]);

      const routes = results.flatMap((result) => {
        if (result.status === 'fulfilled') return result.value.routes;
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load remote routes:', result.reason);
        }
        return [];
      });

      setRemoteRoutes(routes);
    }

    loadRemoteRoutes();
  }, []);

  return (
    // The shell boundary sits inside AppLayout, so the header survives any page error.
    <AppLayout>
      <ShellBoundary>
        {remoteRoutes === null ? <PageSkeleton /> : <AppRoutes routes={remoteRoutes} />}
      </ShellBoundary>
    </AppLayout>
  );
}
