import { cva } from 'class-variance-authority';
import { useState } from 'react';
import { cn } from '../lib/utils';

const pillVariants = cva(
  'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-200',
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
  className?: string;
};

export function CategoryPills({
  categories,
  value,
  defaultValue,
  onValueChange,
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
    <div className={cn('flex gap-2 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-2', className)}>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          aria-pressed={selected === category}
          onClick={() => handleSelect(category)}
          className={pillVariants({ selected: selected === category })}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
