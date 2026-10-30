import { globalStore } from '@repo/events';
import { expectNoA11yViolations, renderWithProviders, screen, within } from '@repo/test-utils';
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
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/user/profile');
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
