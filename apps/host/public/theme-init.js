// Applies the saved theme before the first paint; `AppLayout` takes over the class afterwards.
// The storage key and the values match `@repo/events` (store.ts).
try {
  const theme = localStorage.getItem('cinepulse-theme');
  const systemLight = theme === 'system' && !matchMedia('(prefers-color-scheme: dark)').matches;

  if (theme === 'light' || systemLight) {
    document.documentElement.classList.remove('dark');
  }
} catch {
  // Blocked storage: stay on the dark-first default.
}
