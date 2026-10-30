import { ROUTE_PATHS } from '@repo/routes';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Logo } from './logo';

type FooterLink = {
  label: string;
  href: string;
};

type FooterColumnData = {
  title: string;
  links: FooterLink[];
};

// Only pages that exist: company, support, legal and social links come back with real pages.
const FOOTER_COLUMNS: FooterColumnData[] = [
  {
    title: 'Browse',
    links: [
      { label: 'Home', href: ROUTE_PATHS.HOME },
      { label: 'Movies', href: ROUTE_PATHS.MOVIES },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Profile', href: ROUTE_PATHS.USER_PROFILE },
      { label: 'Settings', href: ROUTE_PATHS.USER_SETTINGS },
    ],
  },
];

const FOOTER_LINK_CLASS = 'text-sm text-muted-foreground hover:text-foreground transition-colors';

export type FooterProps = {
  className?: string;
};

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn('border-border bg-surface border-t', className)}>
      <div className="max-w-page mx-auto px-4 py-12 md:px-8 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 mb-4 md:col-span-4 lg:col-span-1 lg:mb-0">
            <Logo className="mb-4" labelClassName="text-lg" />
            <p className="text-muted-foreground max-w-xs text-sm">
              Your premium destination for movies and series. Stream anytime, anywhere.
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <FooterColumn key={column.title} column={column} />
          ))}
        </div>

        {/* Bottom */}
        <div className="border-border mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="text-muted-foreground text-sm">© 2026 CinePulse. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-xs">Made with passion for cinema</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

type FooterColumnProps = {
  column: FooterColumnData;
};

function FooterColumn({ column }: FooterColumnProps) {
  return (
    <div>
      <h2 className="mb-4 text-sm font-medium">{column.title}</h2>
      <ul className="space-y-3">
        {column.links.map((link) => (
          <li key={link.label}>
            <Link to={link.href} className={FOOTER_LINK_CLASS}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
