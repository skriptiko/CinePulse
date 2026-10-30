import { renderWithProviders, screen, waitFor } from '@repo/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { useHorizontalScroll } from '../use-horizontal-scroll';

function ScrollProbe() {
  const { ref, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll<HTMLDivElement>();

  return (
    <>
      <div ref={ref} data-testid="scroller" />
      <output aria-label="left">{String(canScrollLeft)}</output>
      <output aria-label="right">{String(canScrollRight)}</output>
      <button type="button" onClick={() => scroll('right')}>
        next
      </button>
      <button type="button" onClick={() => scroll('left')}>
        prev
      </button>
    </>
  );
}

/** jsdom has no layout, so give the scroller fixed metrics. */
function setMetrics(
  element: HTMLElement,
  metrics: { scrollLeft: number; scrollWidth: number; clientWidth: number }
) {
  for (const [key, value] of Object.entries(metrics)) {
    Object.defineProperty(element, key, { configurable: true, value });
  }
}

function scrollTo(element: HTMLElement, scrollLeft: number) {
  setMetrics(element, { scrollLeft, scrollWidth: 1000, clientWidth: 400 });
  element.dispatchEvent(new Event('scroll'));
}

function readState() {
  return {
    left: screen.getByRole('status', { name: 'left' }).textContent,
    right: screen.getByRole('status', { name: 'right' }).textContent,
  };
}

describe('useHorizontalScroll', () => {
  it('starts with nothing to scroll when content fits', () => {
    renderWithProviders(<ScrollProbe />);

    expect(readState()).toEqual({ left: 'false', right: 'false' });
  });

  it('updates on scroll events', async () => {
    renderWithProviders(<ScrollProbe />);
    const scroller = screen.getByTestId('scroller');

    scrollTo(scroller, 0);
    await waitFor(() => expect(readState()).toEqual({ left: 'false', right: 'true' }));

    scrollTo(scroller, 300);
    await waitFor(() => expect(readState()).toEqual({ left: 'true', right: 'true' }));

    // Within the end tolerance counts as the end.
    scrollTo(scroller, 595);
    await waitFor(() => expect(readState()).toEqual({ left: 'true', right: 'false' }));
  });

  it('re-measures when children change', async () => {
    renderWithProviders(<ScrollProbe />);
    const scroller = screen.getByTestId('scroller');

    setMetrics(scroller, { scrollLeft: 0, scrollWidth: 1000, clientWidth: 400 });
    scroller.append(document.createElement('div'));

    await waitFor(() => expect(readState()).toEqual({ left: 'false', right: 'true' }));
  });

  it('scrolls by a share of the visible width in the given direction', async () => {
    const { user } = renderWithProviders(<ScrollProbe />);
    const scroller = screen.getByTestId('scroller');
    const scrollBy = vi.fn();
    scroller.scrollBy = scrollBy;
    setMetrics(scroller, { scrollLeft: 0, scrollWidth: 1000, clientWidth: 400 });

    await user.click(screen.getByRole('button', { name: 'next' }));
    await user.click(screen.getByRole('button', { name: 'prev' }));

    expect(scrollBy).toHaveBeenNthCalledWith(1, { left: 320, behavior: 'smooth' });
    expect(scrollBy).toHaveBeenNthCalledWith(2, { left: -320, behavior: 'smooth' });
  });
});
