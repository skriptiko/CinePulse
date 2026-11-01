const FALLBACK_REGION = 'US';

/** The viewer's country from the browser language; many languages name none (`uk`, `en`). */
export function getViewerRegion(): string {
  try {
    return new Intl.Locale(navigator.language).region ?? FALLBACK_REGION;
  } catch {
    // `Intl.Locale` throws on a malformed tag, and a browser may report an empty one.
    return FALLBACK_REGION;
  }
}
