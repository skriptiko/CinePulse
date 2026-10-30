import { type ReactNode, type RefObject, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useResolvedTheme } from '../hooks/use-resolved-theme';
import { Footer } from './footer';
import { Header } from './header';

const MAIN_ID = 'main';

export type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const mainRef = useRef<HTMLElement>(null);
  useThemeClass();
  useFocusOnNavigation(mainRef);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <a
        href={`#${MAIN_ID}`}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>
      <Header />
      <main ref={mainRef} id={MAIN_ID} tabIndex={-1} className="min-h-svh flex-grow outline-none">
        {children}
      </main>
      <Footer />
    </div>
  );
}

/**
 * A client-side navigation leaves focus on a link that may be gone, so it moves to `main`,
 * which exists while the next page suspends. Query changes stay put: they come from filters
 * the user is still typing in.
 */
function useFocusOnNavigation(mainRef: RefObject<HTMLElement | null>): void {
  const { pathname } = useLocation();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname, mainRef]);
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
