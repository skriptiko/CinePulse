import { renderWithProviders, screen } from '@repo/test-utils';
import { Link, useRoutes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { RemoteDefinition } from '../load-remote';
import { useRemoteRoutes } from '../use-remote-routes';

function createRemotes() {
  const pages = {
    name: 'pagesMfe',
    load: vi.fn(async () => ({ routes: [{ path: '/', element: <p>Home page</p> }] })),
    paths: ['/'],
  } satisfies RemoteDefinition;
  const user = {
    name: 'userMfe',
    load: vi.fn(async () => ({ routes: [{ path: '/user/:tab', element: <p>User page</p> }] })),
    paths: ['/user/:tab'],
  } satisfies RemoteDefinition;
  return { pages, user };
}

function Shell({ remotes }: { remotes: readonly RemoteDefinition[] }) {
  const element = useRoutes(useRemoteRoutes(remotes));
  return (
    <>
      <Link to="/user/profile">To user</Link>
      <Link to="/">To home</Link>
      {element}
    </>
  );
}

describe('useRemoteRoutes', () => {
  it('loads only the remote that owns the current path', async () => {
    const { pages, user } = createRemotes();

    renderWithProviders(<Shell remotes={[pages, user]} />, { route: '/user/profile' });

    expect(await screen.findByText('User page')).toBeInTheDocument();
    expect(user.load).toHaveBeenCalledOnce();
    expect(pages.load).not.toHaveBeenCalled();
  });

  it('loads the next remote on navigation, and each remote once', async () => {
    const { pages, user } = createRemotes();
    const { user: actor } = renderWithProviders(<Shell remotes={[pages, user]} />);
    await screen.findByText('Home page');

    await actor.click(screen.getByRole('link', { name: 'To user' }));
    expect(await screen.findByText('User page')).toBeInTheDocument();

    await actor.click(screen.getByRole('link', { name: 'To home' }));
    expect(await screen.findByText('Home page')).toBeInTheDocument();
    expect(pages.load).toHaveBeenCalledOnce();
    expect(user.load).toHaveBeenCalledOnce();
  });

  it('loads nothing on a path no remote owns', () => {
    const { pages, user } = createRemotes();

    renderWithProviders(<Shell remotes={[pages, user]} />, { route: '/nope' });

    expect(pages.load).not.toHaveBeenCalled();
    expect(user.load).not.toHaveBeenCalled();
  });
});
