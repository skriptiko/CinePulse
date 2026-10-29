import { AppRoutes } from '@/AppRoutes';
import { AppLayout, ErrorBoundary } from '@repo/ui';
import { useEffect, useState } from 'react';
import type { RouteObject } from 'react-router-dom';

function App() {
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
    // Temporary: the boundary sits inside AppLayout so a page error keeps header and footer.
    <AppLayout>
      <ErrorBoundary level="shell">
        {remoteRoutes === null ? (
          <div className="p-4">Loading...</div>
        ) : (
          <AppRoutes routes={remoteRoutes} />
        )}
      </ErrorBoundary>
    </AppLayout>
  );
}

export default App;
