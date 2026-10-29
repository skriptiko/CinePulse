import { expectNoA11yViolations, renderWithProviders, screen } from '@repo/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { CategoryPills } from '../category-pills';

const CATEGORIES = ['All', 'Action', 'Drama'];

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
