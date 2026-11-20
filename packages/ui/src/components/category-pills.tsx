import { cva } from 'class-variance-authority';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ROW_GUTTER } from './content-row';

const pillVariants = cva(
  'focus-ring-inset rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      selected: {
        true: 'bg-foreground text-background forced-chosen',
        false: 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground',
      },
    },
  }
);

export type CategoryPillsProps = {
  categories: string[];
  /** Selected category; makes the component controlled. */
  value?: string;
  /** Initial selection when uncontrolled. Defaults to the first category. */
  defaultValue?: string;
  onValueChange?: (category: string) => void;
  /** Disables every pill, e.g. while the filter does not apply. */
  disabled?: boolean;
  /** Accessible name of the group, e.g. "Filter by genre". */
  label?: string;
  /**
   * Adds the row gutter (`ROW_GUTTER`), so the first pill lines up with the first card of a
   * full-width row. Pass `false` when the pills sit inside a block that already has its own
   * padding, such as the catalog filters or the Watchlist column: the first pill then starts on
   * the edge of that block at every breakpoint. Defaults to `true`.
   */
  gutter?: boolean;
  className?: string;
};

export function CategoryPills({
  categories,
  value,
  defaultValue,
  onValueChange,
  disabled,
  label,
  gutter = true,
  className,
}: CategoryPillsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? categories[0]);
  const selected = value ?? uncontrolledValue;

  const handleSelect = (category: string) => {
    if (value === undefined) {
      setUncontrolledValue(category);
    }
    onValueChange?.(category);
  };

  return (
    <fieldset
      aria-label={label}
      className={cn(
        'scrollbar-hide flex min-w-0 gap-2 overflow-x-auto pb-2',
        gutter && ROW_GUTTER,
        className
      )}
    >
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          aria-pressed={selected === category}
          disabled={disabled}
          onClick={() => handleSelect(category)}
          className={pillVariants({ selected: selected === category })}
        >
          {category}
        </button>
      ))}
    </fieldset>
  );
}

export type CategoryLink = {
  label: string;
  href: string;
  /** The view on screen: a tab of Search, say, which is a URL of its own. */
  isCurrent?: boolean;
};

export type CategoryLinksProps = {
  links: CategoryLink[];
  /** Accessible name of the link list, e.g. "Browse by genre". */
  label: string;
  /**
   * Goes on the `nav`, so a width cap such as `max-w-page mx-auto` is the box the list's capped
   * gutter is measured against: a percentage padding resolves against the parent's width.
   */
  className?: string;
};

/** Pills that navigate (e.g. Home → Movies filtered by genre) instead of selecting in place. */
export function CategoryLinks({ links, label, className }: CategoryLinksProps) {
  return (
    <nav aria-label={label} className={className}>
      <ul className={cn('scrollbar-hide flex gap-2 overflow-x-auto pb-2', ROW_GUTTER)}>
        {links.map((link) => (
          <li key={link.href}>
            <Link
              to={link.href}
              aria-current={link.isCurrent ? 'page' : undefined}
              className={cn(pillVariants({ selected: link.isCurrent === true }), 'inline-block')}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
