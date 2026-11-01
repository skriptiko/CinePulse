import type { ReactNode } from 'react';

/** A link in running text; a card passes its own `className`. */
export const EXTERNAL_TEXT_LINK_CLASS =
  'touch-target text-foreground inline-flex items-center text-sm underline underline-offset-4';

export type ExternalLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
};

/** Opens in a new tab with no access to this one, and tells a screen reader so. */
export function ExternalLink({ href, className, children }: ExternalLinkProps) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children} <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
