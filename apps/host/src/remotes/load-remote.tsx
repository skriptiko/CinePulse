import { createTypedEmitter, serializeError } from '@repo/events';
import type { RouteObject } from 'react-router-dom';
import { RemoteUnavailable } from './remote-unavailable';

export type RemoteDefinition = {
  /** Federation name, reported in `mfe:error`. */
  name: string;
  load: () => Promise<{ routes: RouteObject[] }>;
  /** Paths the remote owns: they load it, and show `RemoteUnavailable` if that fails. */
  paths: readonly string[];
};

const emitMfeError = createTypedEmitter('mfe:error');

/** Never rejects: a failed remote is reported and replaced by placeholder routes on its paths. */
export async function loadRemote(remote: RemoteDefinition): Promise<RouteObject[]> {
  try {
    const { routes } = await remote.load();
    return routes;
  } catch (error) {
    emitMfeError({ name: remote.name, error: serializeError(error) });
    return remote.paths.map((path) => ({ path, element: <RemoteUnavailable /> }));
  }
}
