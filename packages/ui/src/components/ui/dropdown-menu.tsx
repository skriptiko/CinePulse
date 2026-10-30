import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { CircleIcon } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../../lib/utils';

export type DropdownMenuProps = {
  children: ReactNode;
};

export function DropdownMenu({ children }: DropdownMenuProps) {
  return <DropdownMenuPrimitive.Root>{children}</DropdownMenuPrimitive.Root>;
}

export type DropdownMenuTriggerProps = Pick<
  ComponentProps<typeof DropdownMenuPrimitive.Trigger>,
  'aria-label' | 'disabled'
> & {
  children: ReactNode;
  /** Style the trigger with `buttonVariants(...)`: it always renders its own button. */
  className?: string;
};

export function DropdownMenuTrigger({
  children,
  'aria-label': ariaLabel,
  disabled,
  className,
}: DropdownMenuTriggerProps) {
  return (
    <DropdownMenuPrimitive.Trigger
      aria-label={ariaLabel}
      disabled={disabled}
      data-slot="dropdown-menu-trigger"
      className={className}
    >
      {children}
    </DropdownMenuPrimitive.Trigger>
  );
}

export type DropdownMenuContentProps = Pick<
  ComponentProps<typeof DropdownMenuPrimitive.Content>,
  'align' | 'sideOffset'
> & {
  children: ReactNode;
  className?: string;
};

export function DropdownMenuContent({
  children,
  align,
  sideOffset = 4,
  className,
}: DropdownMenuContentProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        data-slot="dropdown-menu-content"
        className={cn(
          'bg-popover text-popover-foreground z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md',
          className
        )}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
}

export type DropdownMenuRadioGroupProps = {
  children: ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  'aria-label'?: string;
};

export function DropdownMenuRadioGroup({
  children,
  value,
  onValueChange,
  'aria-label': ariaLabel,
}: DropdownMenuRadioGroupProps) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      value={value}
      onValueChange={onValueChange}
      aria-label={ariaLabel}
      data-slot="dropdown-menu-radio-group"
    >
      {children}
    </DropdownMenuPrimitive.RadioGroup>
  );
}

export type DropdownMenuRadioItemProps = {
  children: ReactNode;
  value: string;
  className?: string;
};

export function DropdownMenuRadioItem({ children, value, className }: DropdownMenuRadioItemProps) {
  return (
    <DropdownMenuPrimitive.RadioItem
      value={value}
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}
