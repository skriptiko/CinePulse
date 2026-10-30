// The main `zustand` entry (not `zustand/vanilla`): Module Federation shares `zustand` as one
// strict singleton, and a subpath import would bypass that share.
import { createStore, type StoreApi, useStore } from 'zustand';

export const THEMES = ['light', 'dark', 'system'] as const;

export type Theme = (typeof THEMES)[number];

export type GlobalState = {
  theme: Theme;
};

export type GlobalActions = {
  setTheme: (theme: Theme) => void;
};

export type GlobalStore = GlobalState & GlobalActions;

export type GlobalStoreApi = StoreApi<GlobalStore>;

// Dark-first design: `system` is opt-in (Settings), so light-OS users still start dark.
const defaultState: GlobalState = {
  theme: 'dark',
};

declare global {
  interface Window {
    __CINEPULSE_STORE__?: GlobalStoreApi;
  }
}

/** A fresh, unshared store. App code uses `globalStore`; this is for tests and tooling. */
export function createGlobalStore(): GlobalStoreApi {
  return createStore<GlobalStore>()((set) => ({
    ...defaultState,
    setTheme: (theme) => {
      set({ theme });
    },
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
