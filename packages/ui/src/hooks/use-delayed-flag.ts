import { useEffect, useState } from 'react';

/** `false` for the first `delayMs` after mount, then `true`. */
export function useDelayedFlag(delayMs: number): boolean {
  const [isDue, setIsDue] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsDue(true), delayMs);
    return () => window.clearTimeout(timeoutId);
  }, [delayMs]);

  return isDue;
}
