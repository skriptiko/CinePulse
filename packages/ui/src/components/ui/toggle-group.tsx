import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

export type ToggleGroupProps = {
  children: ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  'aria-label': string;
  className?: string;
};

/** Single-choice group: arrow keys move between items, and one item always stays selected. */
export function ToggleGroup({
  children,
  value,
  onValueChange,
  'aria-label': ariaLabel,
  className,
}: ToggleGroupProps) {
  // Radix reports '' when the active item is clicked again.
  const handleValueChange = (next: string) => {
    if (next !== '') onValueChange(next);
  };

  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={handleValueChange}
      aria-label={ariaLabel}
      data-slot="toggle-group"
      className={cn('bg-secondary flex items-center rounded-lg p-1', className)}
    >
      {children}
    </ToggleGroupPrimitive.Root>
  );
}

export type ToggleGroupItemProps = {
  children: ReactNode;
  value: string;
  'aria-label': string;
  className?: string;
};

export function ToggleGroupItem({
  children,
  value,
  'aria-label': ariaLabel,
  className,
}: ToggleGroupItemProps) {
  return (
    <ToggleGroupPrimitive.Item
      value={value}
      aria-label={ariaLabel}
      data-slot="toggle-group-item"
      className={cn(
        'text-muted-foreground hover:text-foreground rounded-md p-2 transition-colors',
        'data-[state=on]:bg-background data-[state=on]:text-foreground',
        className
      )}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
}
