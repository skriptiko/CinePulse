import { cva } from 'class-variance-authority';
import { Bell, Menu, Moon, Search, Sun, User, X } from 'lucide-react';
import { type MouseEventHandler, type ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Logo } from './logo';
import { Button } from './ui/button';

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Movies', href: '/movies' },
  { label: 'Series', href: '/series' },
  { label: 'New & Popular', href: '/new' },
  { label: 'My List', href: '/my-list' },
];

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
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Set dark mode as default
    document.documentElement.classList.add('dark');

    const handleScroll = () => {
      setIsScrolled(window.scrollY > SCROLLED_THRESHOLD_PX);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

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
            <IconButton label="Search">
              <Search />
            </IconButton>
            <IconButton label="Notifications" className="hidden sm:flex">
              <Bell />
            </IconButton>
            <IconButton label="Toggle theme" onClick={toggleTheme}>
              {isDark ? <Sun /> : <Moon />}
            </IconButton>
            <Button variant="ghost" size="icon" className="rounded-lg overflow-hidden">
              <div className="size-8 rounded-lg bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center">
                <User className="size-4 text-accent-foreground" />
              </div>
              <span className="sr-only">Profile</span>
            </Button>
            <IconButton label="Menu" className="lg:hidden" onClick={handleMobileMenuToggle}>
              {isMobileMenuOpen ? <X /> : <Menu />}
            </IconButton>
          </div>
        </div>

        {isMobileMenuOpen && (
          <nav className="lg:hidden pt-4 pb-2 border-t border-border mt-4">
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

function NavLinks({ layout, onNavigate }: NavLinksProps) {
  const { pathname } = useLocation();

  return NAV_ITEMS.map((item) => (
    <Link
      key={item.label}
      to={item.href}
      onClick={onNavigate}
      className={navLinkVariants({ layout, active: pathname === item.href })}
    >
      {item.label}
    </Link>
  ));
}

type IconButtonProps = {
  /** Accessible name, rendered as screen-reader-only text. */
  label: string;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
};

/** Muted ghost icon button of the header toolbar. */
function IconButton({ label, children, onClick, className }: IconButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn('rounded-lg text-muted-foreground hover:text-foreground', className)}
    >
      {children}
      <span className="sr-only">{label}</span>
    </Button>
  );
}
