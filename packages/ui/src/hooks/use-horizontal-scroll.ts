import { useCallback, useEffect, useRef, useState } from 'react';

/** Share of the visible width scrolled per arrow click. */
const SCROLL_STEP_RATIO = 0.8;
/** Slack at the end so sub-pixel widths do not keep the "next" arrow visible. */
const END_TOLERANCE_PX = 10;

export type ScrollDirection = 'left' | 'right';

/**
 * Tracks whether a horizontally scrollable element can scroll further in either direction.
 * State follows the element itself (scroll, resize, added/removed children), so it stays
 * correct during smooth scrolling without timers.
 */
export function useHorizontalScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    const { scrollLeft, scrollWidth, clientWidth } = element;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - END_TOLERANCE_PX);
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    updateScrollState();
    element.addEventListener('scroll', updateScrollState, { passive: true });

    const mutationObserver = new MutationObserver(updateScrollState);
    mutationObserver.observe(element, { childList: true });

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateScrollState, { passive: true });
      return () => {
        element.removeEventListener('scroll', updateScrollState);
        window.removeEventListener('resize', updateScrollState);
        mutationObserver.disconnect();
      };
    }

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(element);
    return () => {
      element.removeEventListener('scroll', updateScrollState);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [updateScrollState]);

  const scroll = useCallback((direction: ScrollDirection) => {
    const element = ref.current;
    if (!element) return;

    const step = element.clientWidth * SCROLL_STEP_RATIO;
    element.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' });
  }, []);

  return { ref, canScrollLeft, canScrollRight, scroll };
}
