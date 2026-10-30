import { NotFound } from '@repo/ui';
import { type RouteObject, useRoutes } from 'react-router-dom';

const NOT_FOUND_ROUTE: RouteObject = { path: '*', element: <NotFound /> };

export function AppRoutes({ routes }: { routes: RouteObject[] }) {
  // The catch-all goes last, after every remote's routes.
  return useRoutes([...routes, NOT_FOUND_ROUTE]);
}
