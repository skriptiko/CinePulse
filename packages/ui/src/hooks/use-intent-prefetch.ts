import { useEffect, useRef } from 'react';

/** Hover or focus must last this long before it counts as intent to navigate. */
export const INTENT_DELAY_MS = 200;

export type IntentHandlers = {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
};

/**
 * Runs `prefetch` once the pointer or focus rests on a link for `INTENT_DELAY_MS`, so a
 * cursor passing over the link costs no request.
 */
export function useIntentPrefetch(prefetch: () => void): IntentHandlers {
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  const start = () => {
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(prefetch, INTENT_DELAY_MS);
  };
  const cancel = () => window.clearTimeout(timeoutRef.current);

  return { onMouseEnter: start, onMouseLeave: cancel, onFocus: start, onBlur: cancel };
}
