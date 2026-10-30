import { createTypedListener } from '@repo/events';

const onNotification = createTypedListener('notification:show');

/**
 * Shows every `notification:show` as a toast. Call once, in the host. sonner is loaded on
 * the first notification; the lazy `Toaster` shares the same module.
 */
export function subscribeToNotifications(): () => void {
  return onNotification(({ type, message, duration }) => {
    void import('sonner').then(({ toast }) => {
      toast[type](message, { duration });
    });
  });
}
