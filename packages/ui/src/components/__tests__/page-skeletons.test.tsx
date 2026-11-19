import { renderWithProviders, screen } from '@repo/test-utils';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ROW_GUTTER } from '../content-row';
import {
  CardGridSkeleton,
  ContentRowSkeleton,
  FeaturedGridSkeleton,
  PageSkeleton,
  SKELETON_DELAY_MS,
} from '../page-skeletons';

describe('CardGridSkeleton', () => {
  it('shows only the cards of a grid, for a page that keeps its own heading', () => {
    const { container } = renderWithProviders(<CardGridSkeleton />);

    expect(screen.getByTestId('page-skeleton')).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(12);
  });
});

describe('section skeletons', () => {
  it('starts a row on the gutter of ContentRow', () => {
    renderWithProviders(<ContentRowSkeleton />);

    expect(screen.getByTestId('page-skeleton')).toHaveClass(...ROW_GUTTER.split(' '));
  });

  it("caps Editor's Picks like the grid on Home", () => {
    renderWithProviders(<FeaturedGridSkeleton />);

    expect(screen.getByTestId('page-skeleton')).toHaveClass(
      'max-w-page',
      'mx-auto',
      'px-4',
      'sm:px-6',
      'lg:px-12'
    );
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
