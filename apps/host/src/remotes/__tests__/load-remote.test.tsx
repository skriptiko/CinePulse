import { createTypedListener } from '@repo/events';
import { renderWithProviders, screen } from '@repo/test-utils';
import { type RouteObject, useRoutes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { loadRemote, type RemoteDefinition } from '../load-remote';

const onMfeError = createTypedListener('mfe:error');

const PAGES: RemoteDefinition = {
  name: 'pagesMfe',
  load: async () => ({ routes: [{ path: '/', element: <p>Home page</p> }] }),
  paths: ['/'],
};

const BROKEN_USER: RemoteDefinition = {
  name: 'userMfe',
  load: () => Promise.reject(new TypeError('Failed to fetch dynamically imported module')),
  paths: ['/user/profile', '/user/settings'],
};

function Routes({ routes }: { routes: RouteObject[] }) {
  return useRoutes(routes);
}

describe('loadRemote', () => {
  it('returns the routes of a loaded remote', async () => {
    const routes = await loadRemote(PAGES);

    expect(routes.map((route) => route.path)).toEqual(['/']);
  });

  it('puts placeholders on the paths of a failed remote', async () => {
    const routes = await loadRemote(BROKEN_USER);

    expect(routes.map((route) => route.path)).toEqual(['/user/profile', '/user/settings']);

    renderWithProviders(<Routes routes={routes} />, { route: '/user/settings' });
    expect(screen.getByRole('alert')).toHaveTextContent('This section is unavailable');
  });

  it('reports the failure as mfe:error with a serialized error', async () => {
    const reports: unknown[] = [];
    const unsubscribe = onMfeError((payload) => reports.push(payload));

    await loadRemote(BROKEN_USER);

    expect(reports).toEqual([
      {
        name: 'userMfe',
        error: { name: 'TypeError', message: 'Failed to fetch dynamically imported module' },
      },
    ]);
    unsubscribe();
  });
});
