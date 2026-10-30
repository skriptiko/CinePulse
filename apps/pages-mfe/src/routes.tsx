import { ROUTE_PATHS } from '@repo/routes';
import { MovieGridSkeleton, PageBoundary } from '@repo/ui';
import type { RouteObject } from 'react-router-dom';
import { Home } from './pages/home/home-page';
import { Movies } from './pages/movies/movies-page';

export const routes: RouteObject[] = [
  {
    path: ROUTE_PATHS.HOME,
    element: (
      // Home never suspends as a whole: each section has its own boundary and skeleton.
      <PageBoundary>
        <Home />
      </PageBoundary>
    ),
  },
  {
    path: ROUTE_PATHS.MOVIES,
    element: (
      <PageBoundary fallback={<MovieGridSkeleton />}>
        <Movies />
      </PageBoundary>
    ),
  },
];
