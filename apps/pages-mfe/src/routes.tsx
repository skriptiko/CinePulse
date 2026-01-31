import { ROUTE_PATHS } from '@repo/routes';
import type { RouteObject } from 'react-router-dom';
import Home from './pages/Home';
import Movies from './pages/Movies';

export const routes: RouteObject[] = [
  {
    path: ROUTE_PATHS.HOME,
    element: <Home />,
  },
  {
    path: ROUTE_PATHS.MOVIES,
    element: <Movies />,
  },
];
