// @vitest-environment jsdom
// The store is a `window` singleton and the hook renders React, so this file needs a DOM.
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { THEMES, createGlobalStore, getGlobalStore, globalStore, useGlobalStore } from '../store';

afterEach(() => {
  cleanup();
  globalStore.setState({ theme: 'dark' });
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
