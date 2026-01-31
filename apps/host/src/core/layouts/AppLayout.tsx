import { ROUTE_PATHS } from '@repo/routes';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <nav className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-6">
            <Link to={ROUTE_PATHS.HOME} className="text-xl font-bold text-foreground">
              CinePulse
            </Link>
            <div className="flex gap-4">
              <Link to={ROUTE_PATHS.HOME} className="text-muted-foreground hover:text-foreground">
                Home
              </Link>
              <Link to={ROUTE_PATHS.MOVIES} className="text-muted-foreground hover:text-foreground">
                Movies
              </Link>
              <Link
                to={ROUTE_PATHS.USER_PROFILE}
                className="text-muted-foreground hover:text-foreground"
              >
                Profile
              </Link>
              <Link
                to={ROUTE_PATHS.USER_SETTINGS}
                className="text-muted-foreground hover:text-foreground"
              >
                Settings
              </Link>
            </div>
          </div>
        </nav>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
