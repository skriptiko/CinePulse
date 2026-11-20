import { expectNoA11yViolations, renderWithProviders, screen } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { Footer } from '../footer';

describe('Footer', () => {
  it('links only to pages that exist', () => {
    renderWithProviders(<Footer />);

    expect(screen.getByRole('link', { name: 'Movies' })).toHaveAttribute('href', '/movies');
    expect(screen.getByRole('link', { name: 'TV Shows' })).toHaveAttribute('href', '/tv');
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/user/profile');
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/user/settings'
    );
  });

  it('credits TMDB with its logo and the exact notice from its terms', () => {
    renderWithProviders(<Footer />);

    expect(screen.getByRole('link', { name: 'TMDB' })).toHaveAttribute(
      'href',
      'https://www.themoviedb.org/'
    );
    expect(
      screen.getByText(
        'This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.'
      )
    ).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<Footer />);

    await expectNoA11yViolations(container);
  });
});
