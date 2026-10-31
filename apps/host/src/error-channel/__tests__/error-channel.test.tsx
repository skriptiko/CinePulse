import { ApiError } from '@repo/api';
import { createTypedEmitter, globalStore } from '@repo/events';
import { renderWithProviders, screen } from '@repo/test-utils';
import { onlineManager } from '@tanstack/react-query';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { shouldReport, startErrorReporting } from '../error-reporting';
import { subscribeToNotifications } from '../notification-toasts';
import { OfflineBanner } from '../offline-banner';
import { Toaster } from '../toaster';

describe('shouldReport', () => {
  afterEach(() => onlineManager.setOnline(true));

  it('skips expected failures', () => {
    expect(shouldReport(new ApiError('not_found', 'Not found', { status: 404 }))).toBe(false);
    expect(shouldReport(new DOMException('Aborted', 'AbortError'))).toBe(false);

    onlineManager.setOnline(false);
    expect(shouldReport(new ApiError('network', 'fetch failed'))).toBe(false);
  });

  it('reports bugs and server failures', () => {
    expect(shouldReport(new ApiError('server', 'HTTP 500', { status: 500 }))).toBe(true);
    expect(shouldReport(new ApiError('network', 'fetch failed'))).toBe(true);
    expect(shouldReport(new TypeError('x is undefined'))).toBe(true);
  });
});

describe('startErrorReporting', () => {
  afterEach(() => vi.restoreAllMocks());

  it('logs a remote that failed to load', () => {
    const logError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const stop = startErrorReporting();
    const error = { name: 'TypeError', message: 'Failed to fetch' };

    createTypedEmitter('mfe:error')({ name: 'userMfe', error });
    stop();

    expect(logError).toHaveBeenCalledWith('[mfe:error] userMfe', error);
  });
});

/** A device colour scheme that can change: the returned function changes it. */
function mockDeviceScheme(startsDark: boolean) {
  const listeners = new Set<(event: { matches: boolean }) => void>();
  let isDark = startsDark;
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return isDark;
    },
    addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: (event: { matches: boolean }) => void) =>
      listeners.delete(listener),
  }));
  return (next: boolean) => {
    isDark = next;
    for (const listener of listeners) listener({ matches: next });
  };
}

describe('notification toasts', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    act(() => globalStore.getState().setTheme('dark'));
  });

  it('keeps a chosen theme when the device changes after System', async () => {
    const setDeviceDark = mockDeviceScheme(true);
    const unsubscribe = subscribeToNotifications();
    globalStore.getState().setTheme('system');
    const { container } = renderWithProviders(<Toaster />);

    act(() => globalStore.getState().setTheme('dark'));
    act(() => setDeviceDark(false));
    act(() => createTypedEmitter('notification:show')({ type: 'error', message: 'Seen' }));
    await screen.findByText('Seen');

    expect(container.ownerDocument.querySelector('[data-sonner-theme]')).toHaveAttribute(
      'data-sonner-theme',
      'dark'
    );
    unsubscribe();
  });

  it('shows notification:show as a toast', async () => {
    const unsubscribe = subscribeToNotifications();
    renderWithProviders(<Toaster />);

    act(() =>
      createTypedEmitter('notification:show')({ type: 'error', message: 'Refresh failed' })
    );

    expect(await screen.findByText('Refresh failed')).toBeInTheDocument();
    unsubscribe();
  });
});

describe('OfflineBanner', () => {
  afterEach(() => act(() => onlineManager.setOnline(true)));

  it('appears only while offline', () => {
    renderWithProviders(<OfflineBanner />);
    expect(screen.queryByText(/You are offline/)).not.toBeInTheDocument();

    act(() => onlineManager.setOnline(false));

    expect(screen.getByRole('status')).toHaveTextContent('You are offline');
  });
});
