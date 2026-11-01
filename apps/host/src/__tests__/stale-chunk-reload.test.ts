import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handlePreloadError, RELOAD_COOLDOWN_MS } from '../stale-chunk-reload';

describe('handlePreloadError', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('reloads once and stops Vite from throwing', () => {
    const reload = vi.fn();
    const event = new Event('vite:preloadError', { cancelable: true });

    handlePreloadError(event, reload);

    expect(reload).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('leaves a failure to its caller while offline, as a reload would lose the page', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const reload = vi.fn();
    const event = new Event('vite:preloadError', { cancelable: true });

    handlePreloadError(event, reload);

    expect(reload).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('does not reload again within the cooldown', () => {
    const reload = vi.fn();
    handlePreloadError(new Event('vite:preloadError', { cancelable: true }), reload);

    const secondEvent = new Event('vite:preloadError', { cancelable: true });
    handlePreloadError(secondEvent, reload);

    expect(reload).toHaveBeenCalledTimes(1);
    expect(secondEvent.defaultPrevented).toBe(false);
  });

  it('reloads again after the cooldown', () => {
    const reload = vi.fn();
    handlePreloadError(new Event('vite:preloadError', { cancelable: true }), reload);

    vi.advanceTimersByTime(RELOAD_COOLDOWN_MS);
    handlePreloadError(new Event('vite:preloadError', { cancelable: true }), reload);

    expect(reload).toHaveBeenCalledTimes(2);
  });
});
