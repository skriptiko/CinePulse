import { renderWithProviders, screen } from '@repo/test-utils';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CardGridSkeleton, PageSkeleton, SKELETON_DELAY_MS } from '../page-skeletons';

describe('CardGridSkeleton', () => {
  it('shows only the cards of a grid, for a page that keeps its own heading', () => {
    const { container } = renderWithProviders(<CardGridSkeleton />);

    expect(screen.getByTestId('page-skeleton')).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(12);
  });
});

describe('PageSkeleton', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('reserves the layout at once but reveals it only after the delay', () => {
    renderWithProviders(<PageSkeleton />);
    const skeleton = screen.getByTestId('page-skeleton');

    expect(skeleton).toHaveClass('invisible');

    act(() => vi.advanceTimersByTime(SKELETON_DELAY_MS));

    expect(skeleton).not.toHaveClass('invisible');
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
  });
});
