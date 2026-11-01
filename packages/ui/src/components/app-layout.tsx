import { type ReactNode, type RefObject, useEffect, useLayoutEffect, useRef } from 'react';
import { NavigationType, useLocation, useNavigationType } from 'react-router-dom';
import { useResolvedTheme } from '../hooks/use-resolved-theme';
import { cn } from '../lib/utils';
import { Footer } from './footer';
import { Header } from './header';
import { LINK_ON_IMAGE_CLASS } from './ui/button';

const MAIN_ID = 'main';

export type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const mainRef = useRef<HTMLElement>(null);
  useThemeClass();
  useResetOnNavigation(mainRef);

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <a
        href={`#${MAIN_ID}`}
        className={cn(
          'focus:bg-background sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-medium',
          LINK_ON_IMAGE_CLASS
        )}
      >
        Skip to content
      </a>
      <Header />
      <main ref={mainRef} id={MAIN_ID} tabIndex={-1} className="min-h-svh grow outline-hidden">
        {children}
      </main>
      <Footer />
    </div>
  );
}

/**
 * A client-side navigation leaves focus on a link that may be gone, so it moves to `main`,
 * which exists while the next page suspends. A new page starts at the top; on Back the browser
 * restores the position itself. Query changes stay put: they come from filters the user is still
 * typing in, or from a list that opens where they are reading.
 */
function useResetOnNavigation(mainRef: RefObject<HTMLElement | null>): void {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const previousPathname = useRef(pathname);

  // Before the paint: a page in the cache would flash at the old position.
  useLayoutEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    mainRef.current?.focus({ preventScroll: true });
    if (navigationType !== NavigationType.Pop) window.scrollTo(0, 0);
  }, [pathname, navigationType, mainRef]);
}

/**
 * Mirrors the store's theme onto `<html class="dark">`. `AppLayout` is rendered only by the
 * host (and by a remote's standalone `main.tsx`), so one place owns the class.
 */
function useThemeClass(): void {
  const resolvedTheme = useResolvedTheme();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);
}
