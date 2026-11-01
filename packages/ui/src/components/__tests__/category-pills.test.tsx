import { expectNoA11yViolations, renderWithProviders, screen } from '@repo/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { CategoryLinks, CategoryPills } from '../category-pills';

const CATEGORIES = ['All', 'Action', 'Drama'];

const LINKS = [
  { label: 'Movies', href: '/search?q=dune' },
  { label: 'TV Shows', href: '/search?q=dune&type=tv', isCurrent: true },
];

describe('CategoryLinks', () => {
  it('names the list of links', () => {
    renderWithProviders(<CategoryLinks links={LINKS} label="Search results" />);

    expect(screen.getByRole('navigation', { name: 'Search results' })).toBeInTheDocument();
  });

  it('marks the current link with aria-current, and only that one', () => {
    renderWithProviders(<CategoryLinks links={LINKS} label="Search results" />);

    expect(screen.getByRole('link', { name: 'TV Shows' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Movies' })).not.toHaveAttribute('aria-current');
  });

  it('shows the current link as a chosen pill', () => {
    renderWithProviders(<CategoryLinks links={LINKS} label="Search results" />);

    expect(screen.getByRole('link', { name: 'TV Shows' })).toHaveClass('bg-foreground');
    expect(screen.getByRole('link', { name: 'Movies' })).not.toHaveClass('bg-foreground');
  });

  it('has no structural a11y violations', async () => {
    const { container } = renderWithProviders(
      <CategoryLinks links={LINKS} label="Search results" />
    );

    await expectNoA11yViolations(container);
  });
});

describe('CategoryPills', () => {
  it('selects the first category by default', () => {
    renderWithProviders(<CategoryPills categories={CATEGORIES} />);

    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Drama' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('moves the selection and reports it when uncontrolled', async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <CategoryPills categories={CATEGORIES} onValueChange={onValueChange} />
    );

    await user.click(screen.getByRole('button', { name: 'Drama' }));

    expect(onValueChange).toHaveBeenCalledWith('Drama');
    expect(screen.getByRole('button', { name: 'Drama' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps the selection owned by the parent when controlled', async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <CategoryPills categories={CATEGORIES} value="Action" onValueChange={onValueChange} />
    );

    await user.click(screen.getByRole('button', { name: 'Drama' }));

    expect(onValueChange).toHaveBeenCalledWith('Drama');
    expect(screen.getByRole('button', { name: 'Action' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('has no structural a11y violations', async () => {
    const { container } = renderWithProviders(<CategoryPills categories={CATEGORIES} />);

    await expectNoA11yViolations(container);
  });
});
