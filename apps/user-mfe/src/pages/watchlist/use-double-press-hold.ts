import { useEffect, useState } from 'react';

/** Longer than the pause within a double press, and no longer: a real press is lost too. */
const DOUBLE_PRESS_HOLD_MS = 400;

function keepFocus(event: MouseEvent): void {
  event.preventDefault();
}

/**
 * For content that moves under the finger: `hold` when it moves, and set `pointer-events-none`
 * while `isHolding`, so that the second press of a double one reaches nothing. That press would
 * still clear focus, which the first one has just placed, so a press moves no focus until then.
 */
export function useDoublePressHold() {
  const [isHolding, setIsHolding] = useState(false);

  useEffect(() => {
    if (!isHolding) return;
    const timer = setTimeout(() => setIsHolding(false), DOUBLE_PRESS_HOLD_MS);
    document.addEventListener('mousedown', keepFocus);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', keepFocus);
    };
  }, [isHolding]);

  return { isHolding, hold: () => setIsHolding(true) };
}
