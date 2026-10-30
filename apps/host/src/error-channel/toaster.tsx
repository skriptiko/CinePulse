import { Toaster as Sonner } from 'sonner';

/**
 * The only toast region. Remotes and `@repo/api` never call `toast`: they emit
 * `notification:show`, and `subscribeToNotifications` shows it here.
 */
export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'border-border bg-background text-foreground shadow-lg',
          description: 'text-muted-foreground',
        },
      }}
    />
  );
}
