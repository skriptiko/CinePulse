import { type ReactNode, useEffect } from 'react';
import { useResolvedTheme } from '../hooks/use-resolved-theme';
import { Footer } from './footer';
import { Header } from './header';

export type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  useThemeClass();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
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
