import { AppRoutes } from '@/AppRoutes';
import { AppLayout, ErrorBoundary } from '@repo/ui';
import { useEffect, useState } from 'react';
import type { RouteObject } from 'react-router-dom';

function App() {
  const [remoteRoutes, setRemoteRoutes] = useState<RouteObject[] | null>(null);

  useEffect(() => {
    async function loadRemoteRoutes() {
      try {
        const [pagesModule, userModule] = await Promise.all([
          import('pagesMfe/routes'),
          import('userMfe/routes'),
        ]);

        setRemoteRoutes([...pagesModule.routes, ...userModule.routes]);
      } catch (error) {
        // Log to console only in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load remote routes:', error);
        }
        setRemoteRoutes([]);
      }
    }

    loadRemoteRoutes();
  }, []);

  return (
    <ErrorBoundary level="shell">
      <AppLayout>
        {remoteRoutes === null ? (
          <div className="p-4">Loading...</div>
        ) : (
          <AppRoutes routes={remoteRoutes} />
        )}
      </AppLayout>
    </ErrorBoundary>
  );
}

export default App;
