import { AppLayout } from '@/core';
import { ErrorBoundary } from '@repo/ui';
import { Suspense, useEffect, useState } from 'react';
import type { RouteObject } from 'react-router-dom';
import { useRoutes } from 'react-router-dom';

function AppRoutes() {
  const [remoteRoutes, setRemoteRoutes] = useState<RouteObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRemoteRoutes() {
      try {
        const [pagesModule, userModule] = await Promise.all([
          import('pagesMfe/routes'),
          import('userMfe/routes'),
        ]);

        setRemoteRoutes([...pagesModule.routes, ...userModule.routes]);
      } catch (error) {
        console.error('Failed to load remote routes:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadRemoteRoutes();
  }, []);

  const element = useRoutes(remoteRoutes);

  if (isLoading) {
    return (
      <Suspense fallback={<div className="p-4">Loading...</div>}>
        <div className="p-4">Loading routes...</div>
      </Suspense>
    );
  }

  return element;
}

function App() {
  return (
    <ErrorBoundary level="shell">
      <AppLayout>
        <AppRoutes />
      </AppLayout>
    </ErrorBoundary>
  );
}

export default App;
