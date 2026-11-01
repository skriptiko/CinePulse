import { expectNoA11yViolations, renderWithProviders, screen } from '@repo/test-utils';
import { Link, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppLayout } from '../app-layout';

function BackButton() {
  const navigate = useNavigate();

  return (
    <button type="button" onClick={() => navigate(-1)}>
      Back
    </button>
  );
}

function renderLayout() {
  return renderWithProviders(
    <AppLayout>
      <Link to="/movies">Go to movies</Link>
      <Link to="/?query=dune">Search</Link>
      <BackButton />
    </AppLayout>
  );
}

describe('AppLayout', () => {
  const scrollTo = vi.spyOn(window, 'scrollTo');

  beforeEach(() => {
    scrollTo.mockReset();
    scrollTo.mockImplementation(() => {});
  });

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

  it('starts a new page at the top', async () => {
    const { user } = renderLayout();
    expect(scrollTo).not.toHaveBeenCalled();

    await user.click(screen.getByRole('link', { name: 'Go to movies' }));

    expect(scrollTo).toHaveBeenCalledExactlyOnceWith(0, 0);
  });

  it('keeps the position when only the query changes', async () => {
    const { user } = renderLayout();

    await user.click(screen.getByRole('link', { name: 'Search' }));

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('leaves the position to the browser on Back', async () => {
    const { user } = renderLayout();
    await user.click(screen.getByRole('link', { name: 'Go to movies' }));
    scrollTo.mockClear();

    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(await screen.findByRole('main')).toHaveFocus();
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const { container } = renderLayout();

    await expectNoA11yViolations(container);
  });
});
