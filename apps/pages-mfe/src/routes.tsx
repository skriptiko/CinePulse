import { ROUTE_PATHS } from '@repo/routes';
import { HomeSkeleton, MovieDetailSkeleton, MovieGridSkeleton, PageBoundary } from '@repo/ui';
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const Home = lazy(() =>
  import('./pages/home/home-page').then((module) => ({ default: module.Home }))
);
const MovieDetail = lazy(() =>
  import('./pages/movie-detail/movie-detail-page').then((module) => ({
    default: module.MovieDetail,
  }))
);
const Movies = lazy(() =>
  import('./pages/movies/movies-page').then((module) => ({ default: module.Movies }))
);

export const routes: RouteObject[] = [
  {
    path: ROUTE_PATHS.HOME,
    element: (
      // Past its chunk Home never suspends as a whole: each section has its own boundary.
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
  {
    path: ROUTE_PATHS.MOVIE_DETAIL,
    element: (
      <PageBoundary fallback={<MovieDetailSkeleton />}>
        <MovieDetail />
      </PageBoundary>
    ),
  },
];
