import { ROUTE_PATHS } from '@repo/routes';
import { PageBoundary } from '@repo/ui';
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { RequireAuth } from './components/require-auth';

const Login = lazy(() => import('./pages/login').then((module) => ({ default: module.Login })));
const Profile = lazy(() =>
  import('./pages/profile').then((module) => ({ default: module.Profile }))
);
const Settings = lazy(() =>
  import('./pages/settings').then((module) => ({ default: module.Settings }))
);

export const routes: RouteObject[] = [
  {
    path: ROUTE_PATHS.AUTH_LOGIN,
    element: (
      <PageBoundary>
        <Login />
      </PageBoundary>
    ),
  },
  {
    path: ROUTE_PATHS.USER_PROFILE,
    element: (
      <PageBoundary>
        <RequireAuth>
          <Profile />
        </RequireAuth>
      </PageBoundary>
    ),
  },
  {
    path: ROUTE_PATHS.USER_SETTINGS,
    element: (
      <PageBoundary>
        <RequireAuth>
          <Settings />
        </RequireAuth>
      </PageBoundary>
    ),
  },
];
