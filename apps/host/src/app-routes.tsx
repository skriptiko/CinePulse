import { type RouteObject, useRoutes } from 'react-router-dom';

export function AppRoutes({ routes }: { routes: RouteObject[] }) {
  const element = useRoutes(routes);

  return element || <div className="p-4">Page not found</div>;
}
