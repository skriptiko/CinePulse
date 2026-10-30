import { AppLayout, ShellBoundary } from '@repo/ui';
import { lazy, Suspense } from 'react';
import { AppRoutes } from '@/app-routes';
import { OfflineBanner } from './error-channel/offline-banner';

// Toasts only follow a failed background refetch, long after the first render, so sonner
// stays out of the initial bundle.
const Toaster = lazy(() =>
  import('./error-channel/toaster').then((module) => ({ default: module.Toaster }))
);

import { REMOTES } from './remotes/remotes';
import { useRemoteRoutes } from './remotes/use-remote-routes';

export function App() {
  const remoteRoutes = useRemoteRoutes(REMOTES);

  return (
    // The shell boundary sits inside AppLayout, so the header survives any page error.
    <AppLayout>
      <ShellBoundary>
        <AppRoutes routes={remoteRoutes} />
      </ShellBoundary>
      <OfflineBanner />
      <Suspense fallback={null}>
        <Toaster />
      </Suspense>
    </AppLayout>
  );
}
