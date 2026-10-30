// The main `zustand` entry (not `zustand/vanilla`): Module Federation shares `zustand` as one
// strict singleton, and a subpath import would bypass that share.
import { createStore, type StoreApi, useStore } from 'zustand';
import type { AuthUser } from './types';

export const THEMES = ['light', 'dark', 'system'] as const;

export type Theme = (typeof THEMES)[number];

/** `loading` lasts while a known session is restored; see `startAuthSession`. */
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export type GlobalState = {
  theme: Theme;
  user: AuthUser | null;
  authStatus: AuthStatus;
};

export type GlobalActions = {
  setTheme: (theme: Theme) => void;
  setUser: (user: AuthUser | null) => void;
};

export type GlobalStore = GlobalState & GlobalActions;

export type GlobalStoreApi = StoreApi<GlobalStore>;

// Dark-first design: `system` is opt-in (Settings), so light-OS users still start dark.
const defaultState: GlobalState = {
  theme: 'dark',
  user: null,
  authStatus: 'anonymous',
};

/** Also read by `apps/host/public/theme-init.js`, which applies the theme before the first paint. */
export const THEME_STORAGE_KEY = 'cinepulse-theme';

// Storage throws when the browser blocks it: the theme then lasts until the page closes.
function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return THEMES.find((theme) => theme === stored) ?? null;
  } catch {
    return null;
  }
}

function storeTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // See `readStoredTheme`.
  }
}

declare global {
  interface Window {
    __CINEPULSE_STORE__?: GlobalStoreApi;
  }
}

/** A fresh, unshared store. App code uses `globalStore`; this is for tests and tooling. */
export function createGlobalStore(): GlobalStoreApi {
  return createStore<GlobalStore>()((set) => ({
    ...defaultState,
    theme: readStoredTheme() ?? defaultState.theme,
    setTheme: (theme) => {
      storeTheme(theme);
      set({ theme });
    },
    setUser: (user) => set({ user, authStatus: user ? 'authenticated' : 'anonymous' }),
  }));
}

/** One store per page, shared by every MFE bundle through `window`. */
export function getGlobalStore(): GlobalStoreApi {
  if (typeof window === 'undefined') {
    return createGlobalStore();
  }

  window.__CINEPULSE_STORE__ ??= createGlobalStore();
  return window.__CINEPULSE_STORE__;
}

export const globalStore = getGlobalStore();

/**
 * Subscribes a component to a slice of the global store; it re-renders when the slice changes
 * (compared with `Object.is`). The selector must return a stable value: pick a primitive or an
 * existing reference, or wrap a selector that builds a new object/array in `useShallow`.
 */
export function useGlobalStore<T>(selector: (state: GlobalStore) => T): T {
  return useStore(globalStore, selector);
}
