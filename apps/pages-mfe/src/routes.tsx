import { ROUTE_PATHS } from '@repo/routes';
import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import Home from './pages/Home';
import Movies from './pages/Movies';

export const routes: RouteObject[] = [
  {
    path: ROUTE_PATHS.HOME,
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <Home />
      </Suspense>
    ),
  },
  {
    path: ROUTE_PATHS.MOVIES,
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <Movies />
      </Suspense>
    ),
  },
];
