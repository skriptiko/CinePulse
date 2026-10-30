import { DEFAULT_DISCOVER_FILTERS, movieQueries } from '@repo/api';
import { globalStore } from '@repo/events';
import {
  buildPaginated,
  expectNoA11yViolations,
  renderWithProviders,
  screen,
  server,
  waitFor,
  within,
} from '@repo/test-utils';
import { HttpResponse, http } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { AppLayout } from '../app-layout';
import { Header } from '../header';

describe('Header', () => {
  it('marks the nav link of the current route', () => {
    renderWithProviders(<Header />, { route: '/movies' });

    const nav = screen.getByRole('navigation');
    expect(within(nav).getByRole('link', { name: 'Movies' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(within(nav).getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('links only to routes that exist', () => {
    renderWithProviders(<Header />);

    const links = within(screen.getByRole('navigation')).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/', '/movies']);
  });

  it('offers sign-in to an anonymous visitor', () => {
    renderWithProviders(<Header />);

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/auth/login');
  });

  it('links a signed-in user to the profile and shows their avatar', () => {
    globalStore.getState().setUser({
      uid: 'uid-1',
      displayName: 'Ada',
      email: null,
      photoUrl: 'https://example.com/ada.png',
    });
    const { container } = renderWithProviders(<Header />);

    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/user/profile');
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/ada.png');
    globalStore.getState().setUser(null);
  });

  it('opens the mobile menu and closes it after navigating', async () => {
    const { user } = renderWithProviders(<Header />);
    const menuButton = screen.getByRole('button', { name: 'Menu' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    const mobileNav = document.getElementById(menuButton.getAttribute('aria-controls') ?? '');
    if (!mobileNav) throw new Error('Mobile navigation is not rendered');
    await user.click(within(mobileNav).getByRole('link', { name: 'Movies' }));

    expect(screen.getAllByRole('navigation')).toHaveLength(1);
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('accepts a className', () => {
    renderWithProviders(<Header className="custom" />);

    expect(screen.getByRole('banner')).toHaveClass('custom');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<Header />);

    await expectNoA11yViolations(container);
  });
});

describe('Header theme toggle', () => {
  afterEach(() => globalStore.setState({ theme: 'dark' }));

  it('switches the shared theme and reflects it in aria-pressed', async () => {
    const { user } = renderWithProviders(<AppLayout>content</AppLayout>);
    const toggle = screen.getByRole('button', { name: 'Dark theme' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement).toHaveClass('dark');

    await user.click(toggle);

    expect(globalStore.getState().theme).toBe('light');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement).not.toHaveClass('dark');
  });
});

describe('Header prefetch', () => {
  it('prefetches the default Movies list after hovering the link', async () => {
    server.use(
      http.get('*/api/tmdb/discover/movie', () => HttpResponse.json(buildPaginated([]))),
      http.get('*/api/tmdb/genre/movie/list', () => HttpResponse.json({ genres: [] }))
    );
    const { user, queryClient } = renderWithProviders(<Header />);
    const moviesKey = movieQueries.discover(DEFAULT_DISCOVER_FILTERS).queryKey;

    await user.hover(within(screen.getByRole('navigation')).getByRole('link', { name: 'Movies' }));

    await waitFor(() => expect(queryClient.getQueryState(moviesKey)).toBeDefined());
  });
});
