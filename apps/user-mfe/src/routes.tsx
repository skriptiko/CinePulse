import { ROUTE_PATHS } from '@repo/routes';
import { PageBoundary } from '@repo/ui';
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { RequireAuth } from './components/require-auth';

const Login = lazy(() => import('./pages/login').then((module) => ({ default: module.Login })));
const Profile = lazy(() =>
  import('./pages/profile/profile-page').then((module) => ({ default: module.ProfilePage }))
);
const Settings = lazy(() =>
  import('./pages/settings').then((module) => ({ default: module.Settings }))
);
const Watchlist = lazy(() =>
  import('./pages/watchlist/watchlist-page').then((module) => ({ default: module.WatchlistPage }))
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
  {
    path: ROUTE_PATHS.USER_WATCHLIST,
    element: (
      <PageBoundary>
        <RequireAuth>
          <Watchlist />
        </RequireAuth>
      </PageBoundary>
    ),
  },
];
