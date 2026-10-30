import { useEffect, useState } from 'react';

/** `true` once the page is scrolled past `thresholdPx`; listens passively. */
export function useIsScrolled(thresholdPx: number): boolean {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > thresholdPx);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [thresholdPx]);

  return isScrolled;
}
