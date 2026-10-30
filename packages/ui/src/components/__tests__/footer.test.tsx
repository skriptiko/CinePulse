import { expectNoA11yViolations, renderWithProviders, screen } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { Footer } from '../footer';

describe('Footer', () => {
  it('links only to pages that exist', () => {
    renderWithProviders(<Footer />);

    expect(screen.getByRole('link', { name: 'Movies' })).toHaveAttribute('href', '/movies');
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/user/profile');
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/user/settings'
    );
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<Footer />);

    await expectNoA11yViolations(container);
  });
});
