const RELOAD_AT_KEY = 'cinepulse:stale-chunk-reload-at';

/** A second chunk failure within this window means the chunk is really gone: no more reloads. */
export const RELOAD_COOLDOWN_MS = 60_000;

/**
 * `vite:preloadError` handler. After a deploy, an open tab may request chunks that no longer
 * exist; one reload fetches the new `index.html`. The time of the reload is kept in
 * `sessionStorage`, so a chunk that fails again right after the reload cannot cause a loop.
 */
export function handlePreloadError(event: Event, reload: () => void = reloadPage): void {
  const lastReloadAt = readLastReloadAt();
  if (lastReloadAt !== null && Date.now() - lastReloadAt < RELOAD_COOLDOWN_MS) return;

  event.preventDefault();
  writeLastReloadAt(Date.now());
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

function writeLastReloadAt(time: number): void {
  try {
    window.sessionStorage.setItem(RELOAD_AT_KEY, String(time));
  } catch {
    // Storage can be blocked (private mode). Then a failing chunk could reload repeatedly,
    // but only once per user-visible failure, since each reload restarts the page.
  }
}
