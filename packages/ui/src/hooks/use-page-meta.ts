import { useEffect } from 'react';

const APP_NAME = 'CinePulse';

/** Sets `document.title` for the current page; without a title, the app name alone. */
export function usePageMeta(title?: string): void {
  useEffect(() => {
    document.title = title === undefined ? APP_NAME : `${title} · ${APP_NAME}`;
  }, [title]);
}
