import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { buttonVariants } from './button';

export type DialogProps = {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function Dialog({ children, open, onOpenChange }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogPrimitive.Root>
  );
}

export type DialogContentProps = {
  children: ReactNode;
  /** Required: a dialog with no name is a Radix warning and an unnamed region for screen readers. */
  title: string;
  description: string;
  /** Where focus goes: with no Radix trigger, the dialog does not know the opener. */
  onCloseAutoFocus: () => void;
  className?: string;
};

export function DialogContent({
  children,
  title,
  description,
  onCloseAutoFocus,
  className,
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-slot="dialog-overlay"
        className="bg-background/80 fixed inset-0 z-50"
      />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        onOpenAutoFocus={focusDialog}
        onCloseAutoFocus={onCloseAutoFocus}
        onPointerDownOutside={keepOpen}
        className={cn(
          'bg-popover text-popover-foreground fixed top-1/2 left-1/2 z-50 flex max-h-[85svh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-lg border p-6 shadow-md outline-hidden',
          className
        )}
      >
        <div className="flex flex-col gap-1 pr-8">
          <DialogPrimitive.Title className="text-lg font-semibold break-words">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="text-muted-foreground text-sm">
            {description}
          </DialogPrimitive.Description>
        </div>
        {children}
        {/* Last, so that Tab reaches `children` first. */}
        <DialogPrimitive.Close
          aria-label="Close"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon' }),
            'absolute top-2 right-2'
          )}
        >
          <X aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/**
 * The dialog, not its first control: Radix focuses once, while the controls may still be loading,
 * and a repeated Enter from the opener must do nothing here.
 */
function focusDialog(event: Event): void {
  event.preventDefault();
  if (event.currentTarget instanceof HTMLElement) event.currentTarget.focus();
}

/** The second press of a double tap lands outside, and a stray one must not lose a form. */
function keepOpen(event: Event): void {
  event.preventDefault();
}
