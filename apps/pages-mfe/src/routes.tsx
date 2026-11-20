import { ROUTE_PATHS } from '@repo/routes';
import { HomeSkeleton, MovieDetailSkeleton, MovieGridSkeleton, PageBoundary } from '@repo/ui';
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PageTransition } from './components/page-transition';

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
const TVDetail = lazy(() =>
  import('./pages/tv-detail/tv-detail-page').then((module) => ({ default: module.TVDetail }))
);
const PersonDetail = lazy(() =>
  import('./pages/person/person-page').then((module) => ({ default: module.PersonDetail }))
);
const Search = lazy(() =>
  import('./pages/search/search-page').then((module) => ({ default: module.Search }))
);
const TVShows = lazy(() =>
  import('./pages/tv/tv-page').then((module) => ({ default: module.TVShows }))
);

export const routes: RouteObject[] = [
  {
    path: ROUTE_PATHS.HOME,
    element: (
      // Past its chunk Home never suspends as a whole: each section has its own boundary.
      <PageTransition>
        <PageBoundary fallback={<HomeSkeleton />}>
          <Home />
        </PageBoundary>
      </PageTransition>
    ),
  },
  {
    path: ROUTE_PATHS.MOVIES,
    element: (
      <PageTransition>
        <PageBoundary fallback={<MovieGridSkeleton />}>
          <Movies />
        </PageBoundary>
      </PageTransition>
    ),
  },
  {
    path: ROUTE_PATHS.TV,
    element: (
      <PageTransition>
        <PageBoundary fallback={<MovieGridSkeleton />}>
          <TVShows />
        </PageBoundary>
      </PageTransition>
    ),
  },
  {
    path: ROUTE_PATHS.MOVIE_DETAIL,
    element: (
      <PageTransition>
        <PageBoundary fallback={<MovieDetailSkeleton />}>
          <MovieDetail />
        </PageBoundary>
      </PageTransition>
    ),
  },
  {
    path: ROUTE_PATHS.TV_DETAIL,
    element: (
      <PageTransition>
        <PageBoundary fallback={<MovieDetailSkeleton />}>
          <TVDetail />
        </PageBoundary>
      </PageTransition>
    ),
  },
  {
    path: ROUTE_PATHS.PERSON_DETAIL,
    element: (
      // The same hero, so the same shape: a portrait beside text.
      <PageTransition>
        <PageBoundary fallback={<MovieDetailSkeleton />}>
          <PersonDetail />
        </PageBoundary>
      </PageTransition>
    ),
  },
  {
    path: ROUTE_PATHS.SEARCH,
    element: (
      <PageTransition>
        <PageBoundary fallback={<MovieGridSkeleton />}>
          <Search />
        </PageBoundary>
      </PageTransition>
    ),
  },
];
