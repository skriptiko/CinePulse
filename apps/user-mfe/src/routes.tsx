import { ROUTE_PATHS } from '@repo/routes';
import { PageBoundary } from '@repo/ui';
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const Profile = lazy(() =>
  import('./pages/profile').then((module) => ({ default: module.Profile }))
);
const Settings = lazy(() =>
  import('./pages/settings').then((module) => ({ default: module.Settings }))
);

export const routes: RouteObject[] = [
  {
    path: ROUTE_PATHS.USER_PROFILE,
    element: (
      <PageBoundary>
        <Profile />
      </PageBoundary>
    ),
  },
  {
    path: ROUTE_PATHS.USER_SETTINGS,
    element: (
      <PageBoundary>
        <Settings />
      </PageBoundary>
    ),
  },
];
