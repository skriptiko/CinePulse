import { expectNoA11yViolations, renderWithProviders, screen } from '@repo/test-utils';
import { Link } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppLayout } from '../app-layout';

function renderLayout() {
  return renderWithProviders(
    <AppLayout>
      <Link to="/movies">Go to movies</Link>
      <Link to="/?query=dune">Search</Link>
    </AppLayout>
  );
}

describe('AppLayout', () => {
  it('renders one focusable main landmark', () => {
    renderLayout();

    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
  });

  it('keeps the footer below the fold while a page loads', () => {
    renderLayout();

    expect(screen.getByRole('main')).toHaveClass('min-h-svh');
  });

  it('starts the Tab order with a skip link to main', async () => {
    const { user } = renderLayout();

    await user.tab();

    const skipLink = screen.getByRole('link', { name: 'Skip to content' });
    expect(skipLink).toHaveFocus();
    expect(skipLink).toHaveAttribute('href', '#main');
  });

  it('leaves focus alone on the first render', () => {
    renderLayout();

    expect(screen.getByRole('main')).not.toHaveFocus();
  });

  it('moves focus to main when the page changes', async () => {
    const { user } = renderLayout();

    await user.click(screen.getByRole('link', { name: 'Go to movies' }));

    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('keeps focus when only the query changes', async () => {
    const { user } = renderLayout();
    const link = screen.getByRole('link', { name: 'Search' });

    await user.click(link);

    expect(link).toHaveFocus();
  });

  it('has no axe violations', async () => {
    const { container } = renderLayout();

    await expectNoA11yViolations(container);
  });
});
