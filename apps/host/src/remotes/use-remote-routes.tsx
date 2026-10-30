import { PageSkeleton } from '@repo/ui';
import { useEffect, useRef, useState } from 'react';
import { matchPath, type RouteObject, useLocation } from 'react-router-dom';
import { loadRemote, type RemoteDefinition } from './load-remote';

/**
 * Loads a remote the first time the user reaches one of its paths, so a page downloads only
 * the remote it needs (ADR-0011). Paths of a remote not loaded yet show the page skeleton.
 */
export function useRemoteRoutes(remotes: readonly RemoteDefinition[]): RouteObject[] {
  const { pathname } = useLocation();
  const [loadedRoutes, setLoadedRoutes] = useState<Record<string, RouteObject[]>>({});
  const startedRemotes = useRef(new Set<string>());

  const owner = remotes.find(({ paths }) => paths.some((path) => matchPath(path, pathname)));

  useEffect(() => {
    if (owner === undefined || startedRemotes.current.has(owner.name)) return;
    startedRemotes.current.add(owner.name);

    void loadRemote(owner).then((routes) => {
      setLoadedRoutes((current) => ({ ...current, [owner.name]: routes }));
    });
  }, [owner]);

  return remotes.flatMap(
    ({ name, paths }) =>
      loadedRoutes[name] ?? paths.map((path) => ({ path, element: <PageSkeleton /> }))
  );
}
