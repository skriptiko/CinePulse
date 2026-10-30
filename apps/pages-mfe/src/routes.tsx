import { ROUTE_PATHS } from '@repo/routes';
import { HomeSkeleton, MovieGridSkeleton, PageBoundary } from '@repo/ui';
import type { RouteObject } from 'react-router-dom';
import { Home } from './pages/home';
import { Movies } from './pages/movies/movies-page';

export const routes: RouteObject[] = [
  {
    path: ROUTE_PATHS.HOME,
    element: (
      <PageBoundary fallback={<HomeSkeleton />}>
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
