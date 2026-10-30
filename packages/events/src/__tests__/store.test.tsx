// @vitest-environment jsdom
// The store is a `window` singleton and the hook renders React, so this file needs a DOM.
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createGlobalStore,
  getGlobalStore,
  globalStore,
  THEME_STORAGE_KEY,
  THEMES,
  useGlobalStore,
} from '../store';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  globalStore.setState({ theme: 'dark' });
});

describe('auth state', () => {
  const user = { uid: 'uid-1', displayName: 'Ada', email: null, photoUrl: null };

  it('starts anonymous, so a page never waits for a session nobody has', () => {
    expect(createGlobalStore().getState()).toMatchObject({ user: null, authStatus: 'anonymous' });
  });

  it('marks a set user as authenticated', () => {
    const store = createGlobalStore();

    store.getState().setUser(user);

    expect(store.getState()).toMatchObject({ user, authStatus: 'authenticated' });
  });

  it('marks a cleared user as anonymous', () => {
    const store = createGlobalStore();
    store.getState().setUser(user);

    store.getState().setUser(null);

    expect(store.getState()).toMatchObject({ user: null, authStatus: 'anonymous' });
  });
});

describe('theme persistence', () => {
  it('restores a saved theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');

    expect(createGlobalStore().getState().theme).toBe('light');
  });

  it('saves the chosen theme', () => {
    createGlobalStore().getState().setTheme('system');

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
  });

  it('ignores a stored value that is not a theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'neon');

    expect(createGlobalStore().getState().theme).toBe('dark');
  });

  it('keeps working when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });

    const store = createGlobalStore();
    store.getState().setTheme('light');

    expect(store.getState().theme).toBe('light');
  });
});

describe('globalStore', () => {
  it('lives on window and is returned by every getGlobalStore call', () => {
    expect(window.__CINEPULSE_STORE__).toBe(globalStore);
    expect(getGlobalStore()).toBe(globalStore);
  });

  it('is reused by a second bundle of the package (another MFE)', async () => {
    vi.resetModules();
    const secondBundle = await import('../store');

    expect(secondBundle.globalStore).toBe(globalStore);
  });

  it('starts with the dark theme (dark-first)', () => {
    expect(createGlobalStore().getState().theme).toBe('dark');
  });

  it('setTheme updates the state and notifies subscribers', () => {
    const listener = vi.fn();
    const unsubscribe = globalStore.subscribe(listener);

    globalStore.getState().setTheme('light');

    expect(globalStore.getState().theme).toBe('light');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0]?.[0]).toMatchObject({ theme: 'light' });
    unsubscribe();
  });

  it('lists every theme in THEMES', () => {
    expect(THEMES).toEqual(['light', 'dark', 'system']);
  });
});

function ThemeLabel() {
  const theme = useGlobalStore((state) => state.theme);
  return <p>{theme}</p>;
}

describe('useGlobalStore', () => {
  it('re-renders the component when the selected slice changes', () => {
    render(<ThemeLabel />);
    expect(screen.getByText('dark')).toBeDefined();

    act(() => {
      globalStore.getState().setTheme('light');
    });

    expect(screen.getByText('light')).toBeDefined();
  });

  it('picks up a change made through getGlobalStore elsewhere (another MFE)', () => {
    render(<ThemeLabel />);

    act(() => {
      getGlobalStore().getState().setTheme('dark');
    });

    expect(screen.getByText('dark')).toBeDefined();
  });
});
