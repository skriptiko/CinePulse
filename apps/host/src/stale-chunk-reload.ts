const RELOAD_AT_KEY = 'cinepulse:stale-chunk-reload-at';

/** A second chunk failure within this window means the chunk is really gone: no more reloads. */
export const RELOAD_COOLDOWN_MS = 60_000;

/**
 * `vite:preloadError` handler. After a deploy, an open tab may request chunks that no longer
 * exist; one reload fetches the new `index.html`. The time of the reload is kept in
 * `sessionStorage`, so a chunk that fails again right after the reload cannot cause a loop.
 * Where the time cannot be kept there is no reload, and the failure goes to its caller.
 */
export function handlePreloadError(event: Event, reload: () => void = reloadPage): void {
  // Offline, a reload fetches no new `index.html`, only the browser's error page.
  if (!navigator.onLine) return;

  const lastReloadAt = readLastReloadAt();
  if (lastReloadAt !== null && Date.now() - lastReloadAt < RELOAD_COOLDOWN_MS) return;

  // With no time kept, the page after a reload could not tell it had reloaded, and would loop.
  if (!writeLastReloadAt(Date.now())) return;

  event.preventDefault();
  reload();
}

function reloadPage(): void {
  window.location.reload();
}

function readLastReloadAt(): number | null {
  try {
    const value = window.sessionStorage.getItem(RELOAD_AT_KEY);
    return value === null ? null : Number(value);
  } catch {
    return null;
  }
}

/** Reads the time back, as a storage can refuse in two ways: it throws, or it does nothing. */
function writeLastReloadAt(time: number): boolean {
  try {
    window.sessionStorage.setItem(RELOAD_AT_KEY, String(time));
    return readLastReloadAt() === time;
  } catch {
    return false;
  }
}
