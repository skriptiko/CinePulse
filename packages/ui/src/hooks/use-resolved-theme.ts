import { useGlobalStore } from '@repo/events';
import { useSyncExternalStore } from 'react';

export type ResolvedTheme = 'light' | 'dark';

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

/** The theme actually shown: `system` follows the OS setting and updates when it changes. */
export function useResolvedTheme(): ResolvedTheme {
  const theme = useGlobalStore((state) => state.theme);
  const prefersDark = useSyncExternalStore(subscribeToColorScheme, getPrefersDark, getPrefersDark);

  if (theme === 'system') return prefersDark ? 'dark' : 'light';
  return theme;
}

function subscribeToColorScheme(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => {};
  const mediaQuery = window.matchMedia(DARK_SCHEME_QUERY);
  mediaQuery.addEventListener('change', onChange);
  return () => mediaQuery.removeEventListener('change', onChange);
}

// Without matchMedia (tests, very old browsers) the dark-first default applies.
function getPrefersDark(): boolean {
  if (typeof window.matchMedia !== 'function') return true;
  return window.matchMedia(DARK_SCHEME_QUERY).matches;
}
