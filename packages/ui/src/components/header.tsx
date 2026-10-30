import { useGlobalStore } from '@repo/events';
import { ROUTE_PATHS } from '@repo/routes';
import { cva } from 'class-variance-authority';
import { Menu, Moon, Search, Sun, User, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useIsScrolled } from '../hooks/use-is-scrolled';
import { useResolvedTheme } from '../hooks/use-resolved-theme';
import { cn } from '../lib/utils';
import { Logo } from './logo';
import { Button, buttonVariants } from './ui/button';

// Only routes that exist: Series, New & Popular and My List come back with their pages.
const NAV_ITEMS = [
  { label: 'Home', href: ROUTE_PATHS.HOME },
  { label: 'Movies', href: ROUTE_PATHS.MOVIES },
] as const;

const MOBILE_NAV_ID = 'mobile-nav';

const TOOLBAR_BUTTON_CLASS = 'rounded-lg text-muted-foreground hover:text-foreground';

/** Scroll offset after which the header gets its glass background. */
const SCROLLED_THRESHOLD_PX = 20;

const navLinkVariants = cva('px-4 text-sm transition-colors rounded-lg', {
  variants: {
    layout: {
      desktop: 'py-2',
      mobile: 'py-3',
    },
    active: {
      true: 'text-foreground bg-secondary font-medium',
      false: 'text-muted-foreground hover:text-foreground hover:bg-secondary',
    },
  },
});

export type HeaderProps = {
  className?: string;
};

export function Header({ className }: HeaderProps) {
  const isScrolled = useIsScrolled(SCROLLED_THRESHOLD_PX);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isDark = useResolvedTheme() === 'dark';
  const setTheme = useGlobalStore((state) => state.setTheme);

  const handleThemeToggle = () => setTheme(isDark ? 'light' : 'dark');

  const handleMobileMenuToggle = () => setIsMobileMenuOpen((isOpen) => !isOpen);
  const handleMobileMenuClose = () => setIsMobileMenuOpen(false);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-[padding,background-color] duration-300',
        isScrolled ? 'glass py-3' : 'bg-transparent py-5',
        className
      )}
    >
      <div className="max-w-[1800px] mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <Logo labelClassName="text-xl hidden sm:block" />
            <nav className="hidden lg:flex items-center gap-1">
              <NavLinks layout="desktop" />
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={ROUTE_PATHS.MOVIES}
              aria-label="Search movies"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                TOOLBAR_BUTTON_CLASS
              )}
            >
              <Search />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Dark theme"
              aria-pressed={isDark}
              onClick={handleThemeToggle}
              className={TOOLBAR_BUTTON_CLASS}
            >
              {isDark ? <Sun /> : <Moon />}
            </Button>
            <Link
              to={ROUTE_PATHS.USER_PROFILE}
              aria-label="Profile"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'rounded-lg overflow-hidden'
              )}
            >
              <span className="size-8 rounded-lg bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center">
                <User className="size-4 text-accent-foreground" />
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls={MOBILE_NAV_ID}
              onClick={handleMobileMenuToggle}
              className={cn(TOOLBAR_BUTTON_CLASS, 'lg:hidden')}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <nav id={MOBILE_NAV_ID} className="lg:hidden pt-4 pb-2 border-t border-border mt-4">
            <div className="flex flex-col gap-1">
              <NavLinks layout="mobile" onNavigate={handleMobileMenuClose} />
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

type NavLinksProps = {
  layout: 'desktop' | 'mobile';
  onNavigate?: () => void;
};

/** `NavLink` sets `aria-current="page"` on the active item; `end` keeps Home from matching all. */
function NavLinks({ layout, onNavigate }: NavLinksProps) {
  return NAV_ITEMS.map((item) => (
    <NavLink
      key={item.label}
      to={item.href}
      end
      onClick={onNavigate}
      className={({ isActive }) => navLinkVariants({ layout, active: isActive })}
    >
      {item.label}
    </NavLink>
  ));
}
