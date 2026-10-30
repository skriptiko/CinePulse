import { createTypedEmitter, serializeError } from '@repo/events';
import type { RouteObject } from 'react-router-dom';
import { RemoteUnavailable } from './remote-unavailable';

export type RemoteDefinition = {
  /** Federation name, reported in `mfe:error`. */
  name: string;
  load: () => Promise<{ routes: RouteObject[] }>;
  /** Paths the remote owns: they show `RemoteUnavailable` when it fails to load. */
  paths: readonly string[];
};

const emitMfeError = createTypedEmitter('mfe:error');

/**
 * Loads every remote independently: a failed one is replaced by placeholder routes on its
 * own paths and reported, the others load as usual.
 */
export async function loadRemoteRoutes(
  remotes: readonly RemoteDefinition[]
): Promise<RouteObject[]> {
  const results = await Promise.allSettled(remotes.map((remote) => remote.load()));

  return results.flatMap((result, index) => {
    const remote = remotes[index];
    if (result.status === 'fulfilled') return result.value.routes;
    if (remote === undefined) return [];

    reportRemoteFailure(remote.name, result.reason);
    return remote.paths.map((path) => ({ path, element: <RemoteUnavailable /> }));
  });
}

function reportRemoteFailure(name: string, reason: unknown): void {
  emitMfeError({ name, error: serializeError(reason) });
  if (import.meta.env.DEV) {
    console.error(`Failed to load remote "${name}":`, reason);
  }
}
