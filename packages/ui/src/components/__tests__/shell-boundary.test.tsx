import { renderWithProviders, screen } from '@repo/test-utils';
import { Link, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShellBoundary } from '../shell-boundary';

/** Crashes on the first path of `renderWithProviders`, works anywhere else. */
function Page() {
  const { pathname } = useLocation();
  if (pathname === '/') throw new Error('render failed');
  return <p>Page content</p>;
}

describe('ShellBoundary', () => {
  const reload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('location', { ...window.location, reload });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function pressReload() {
    const { user } = renderWithProviders(
      <ShellBoundary>
        <Page />
      </ShellBoundary>
    );
    await user.click(screen.getByRole('button', { name: 'Reload' }));
  }

  it('shows a reload fallback instead of a crashed page', () => {
    renderWithProviders(
      <ShellBoundary>
        <Page />
      </ShellBoundary>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  it('reloads the page on Reload', async () => {
    await pressReload();

    expect(reload).toHaveBeenCalledOnce();
  });

  it('stays on the page offline, where a reload would lose it', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    await pressReload();

    expect(reload).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });

  it('clears the error after navigating away', async () => {
    const { user } = renderWithProviders(
      <>
        <Link to="/movies">Movies</Link>
        <ShellBoundary>
          <Page />
        </ShellBoundary>
      </>
    );

    await user.click(screen.getByRole('link', { name: 'Movies' }));

    expect(screen.getByText('Page content')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
