import { expectNoA11yViolations, renderWithProviders, screen } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { Settings } from '../settings';

describe('Settings', () => {
  it('has a page title and heading', () => {
    renderWithProviders(<Settings />);

    expect(screen.getByRole('heading', { level: 1, name: 'User Settings' })).toBeInTheDocument();
    expect(document.title).toBe('Settings · CinePulse');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<Settings />);

    await expectNoA11yViolations(container);
  });
});
