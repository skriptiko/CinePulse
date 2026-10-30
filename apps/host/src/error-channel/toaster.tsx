import { useGlobalStore } from '@repo/events';
import { Toaster as Sonner } from 'sonner';

/**
 * The only toast region. Remotes and `@repo/api` never call `toast`: they emit
 * `notification:show`, and `subscribeToNotifications` shows it here.
 */
export function Toaster() {
  const theme = useGlobalStore((state) => state.theme);

  return (
    <Sonner
      theme={theme}
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
