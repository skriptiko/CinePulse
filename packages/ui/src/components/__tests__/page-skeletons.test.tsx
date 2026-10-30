import { renderWithProviders, screen } from '@repo/test-utils';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PageSkeleton, SKELETON_DELAY_MS } from '../page-skeletons';

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
