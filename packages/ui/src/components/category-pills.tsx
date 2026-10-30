import { cva } from 'class-variance-authority';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const pillVariants = cva(
  'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      selected: {
        true: 'bg-foreground text-background',
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
  className?: string;
};

export function CategoryPills({
  categories,
  value,
  defaultValue,
  onValueChange,
  disabled,
  label,
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
        'flex min-w-0 gap-2 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-2',
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
};

export type CategoryLinksProps = {
  links: CategoryLink[];
  /** Accessible name of the link list, e.g. "Browse by genre". */
  label: string;
  className?: string;
};

/** Pills that navigate (e.g. Home → Movies filtered by genre) instead of selecting in place. */
export function CategoryLinks({ links, label, className }: CategoryLinksProps) {
  return (
    <nav aria-label={label}>
      <ul className={cn('flex gap-2 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-2', className)}>
        {links.map((link) => (
          <li key={link.href}>
            <Link to={link.href} className={cn(pillVariants({ selected: false }), 'inline-block')}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
