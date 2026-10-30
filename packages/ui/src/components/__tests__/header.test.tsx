import { renderWithProviders, screen, within } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { Header } from '../header';

describe('Header', () => {
  it('highlights the nav link of the current route', () => {
    renderWithProviders(<Header />, { route: '/movies' });

    const nav = screen.getByRole('navigation');
    expect(within(nav).getByRole('link', { name: 'Movies' })).toHaveClass('font-medium');
    expect(within(nav).getByRole('link', { name: 'Home' })).not.toHaveClass('font-medium');
  });

  it('opens the mobile menu and closes it after navigating', async () => {
    const { user } = renderWithProviders(<Header />);
    expect(screen.getAllByRole('navigation')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    const [, mobileNav] = screen.getAllByRole('navigation');
    if (!mobileNav) throw new Error('Mobile navigation is not rendered');
    await user.click(within(mobileNav).getByRole('link', { name: 'Series' }));

    expect(screen.getAllByRole('navigation')).toHaveLength(1);
  });

  it('accepts a className', () => {
    renderWithProviders(<Header className="custom" />);

    expect(screen.getByRole('banner')).toHaveClass('custom');
  });
});
