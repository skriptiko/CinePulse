import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { CircleIcon } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../lib/utils';

export type DropdownMenuProps = {
  children: ReactNode;
};

export function DropdownMenu({ children }: DropdownMenuProps) {
  return <DropdownMenuPrimitive.Root>{children}</DropdownMenuPrimitive.Root>;
}

export type DropdownMenuTriggerProps = Pick<
  ComponentProps<typeof DropdownMenuPrimitive.Trigger>,
  'aria-label'
> & {
  children: ReactNode;
  /** Style the trigger with `buttonVariants(...)`; `asChild` is not supported. */
  className?: string;
};

export function DropdownMenuTrigger({
  children,
  'aria-label': ariaLabel,
  className,
}: DropdownMenuTriggerProps) {
  return (
    <DropdownMenuPrimitive.Trigger
      aria-label={ariaLabel}
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
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md',
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
};

export function DropdownMenuRadioGroup({
  children,
  value,
  onValueChange,
}: DropdownMenuRadioGroupProps) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      value={value}
      onValueChange={onValueChange}
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
