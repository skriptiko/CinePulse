import { ROUTE_PATHS } from '@repo/routes';
import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

export const routes: RouteObject[] = [
  {
    path: ROUTE_PATHS.USER_PROFILE,
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <Profile />
      </Suspense>
    ),
  },
  {
    path: ROUTE_PATHS.USER_SETTINGS,
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <Settings />
      </Suspense>
    ),
  },
];
