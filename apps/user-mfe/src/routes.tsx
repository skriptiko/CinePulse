import { ROUTE_PATHS } from '@repo/routes';
import type { RouteObject } from 'react-router-dom';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

export const routes: RouteObject[] = [
  {
    path: ROUTE_PATHS.USER_PROFILE,
    element: <Profile />,
  },
  {
    path: ROUTE_PATHS.USER_SETTINGS,
    element: <Settings />,
  },
];
