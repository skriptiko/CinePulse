import { expectNoA11yViolations, renderWithProviders, screen } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { NotFound } from '../not-found';

describe('NotFound', () => {
  it('links back home', () => {
    renderWithProviders(<NotFound />);

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
    expect(document.title).toBe('Page not found · CinePulse');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<NotFound />);

    await expectNoA11yViolations(container);
  });
});
