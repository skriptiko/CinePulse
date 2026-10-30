import { ROUTE_PATHS } from '@repo/routes';
import { PageBoundary } from '@repo/ui';
import type { RouteObject } from 'react-router-dom';
import { Profile } from './pages/profile';
import { Settings } from './pages/settings';

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
