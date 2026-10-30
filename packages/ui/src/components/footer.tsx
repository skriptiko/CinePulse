import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Logo } from './logo';

type FooterLink = {
  label: string;
  href: string;
  /** Opens in a new tab as a plain anchor instead of a router link. */
  external?: boolean;
};

type FooterColumnData = {
  title: string;
  links: FooterLink[];
};

const FOOTER_COLUMNS: FooterColumnData[] = [
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Cookie Settings', href: '/cookies' },
    ],
  },
  {
    title: 'Social',
    links: [
      { label: 'Twitter', href: 'https://twitter.com', external: true },
      { label: 'Instagram', href: 'https://instagram.com', external: true },
      { label: 'Facebook', href: 'https://facebook.com', external: true },
    ],
  },
];

const FOOTER_LINK_CLASS = 'text-sm text-muted-foreground hover:text-foreground transition-colors';

export type FooterProps = {
  className?: string;
};

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn('border-t border-border bg-surface', className)}>
      <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-4 lg:mb-0">
            <Logo className="mb-4" labelClassName="text-lg" />
            <p className="text-sm text-muted-foreground max-w-xs">
              Your premium destination for movies and series. Stream anytime, anywhere.
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <FooterColumn key={column.title} column={column} />
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© 2026 CinePulse. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">Made with passion for cinema</span>
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
      <h4 className="font-medium text-sm mb-4">{column.title}</h4>
      <ul className="space-y-3">
        {column.links.map((link) => (
          <li key={link.label}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={FOOTER_LINK_CLASS}
              >
                {link.label}
              </a>
            ) : (
              <Link to={link.href} className={FOOTER_LINK_CLASS}>
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
