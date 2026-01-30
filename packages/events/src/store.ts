import type { UserProfile } from './types';

export interface GlobalState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface GlobalActions {
  setUser: (user: UserProfile | null) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  setTheme: (theme: GlobalState['theme']) => void;
  reset: () => void;
}

export type GlobalStore = GlobalState & GlobalActions;

const initialState: GlobalState = {
  user: null,
  isAuthenticated: false,
  theme: 'system',
};

declare global {
  interface Window {
    __CINEPULSE_STORE__?: GlobalStore;
  }
}

type SetState = (
  partial:
    | GlobalState
    | Partial<GlobalState>
    | ((state: GlobalState) => GlobalState | Partial<GlobalState>)
) => void;
type GetState = () => GlobalState;

function createStoreImpl(set: SetState, get: GetState): GlobalStore {
  return {
    ...initialState,
    setUser: (user) => {
      set({ user, isAuthenticated: user !== null });
    },
    updateUser: (updates) => {
      const currentUser = get().user;
      if (currentUser) {
        set({ user: { ...currentUser, ...updates } });
      }
    },
    setTheme: (theme) => {
      set({ theme });
    },
    reset: () => {
      set(initialState);
    },
  };
}

export function createGlobalStore(): GlobalStore {
  let state: GlobalState = { ...initialState };
  const listeners = new Set<() => void>();

  const getState: GetState = () => state;

  const setState: SetState = (partial) => {
    const nextState = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...nextState };
    for (const listener of listeners) {
      listener();
    }
  };

  return createStoreImpl(setState, getState);
}

export function getGlobalStore(): GlobalStore {
  if (typeof window === 'undefined') {
    return createGlobalStore();
  }

  if (!window.__CINEPULSE_STORE__) {
    window.__CINEPULSE_STORE__ = createGlobalStore();
  }

  return window.__CINEPULSE_STORE__;
}

export const globalStore = getGlobalStore();
