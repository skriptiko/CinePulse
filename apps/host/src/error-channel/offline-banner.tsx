import { onlineManager } from '@tanstack/react-query';
import { WifiOff } from 'lucide-react';
import { useSyncExternalStore } from 'react';

/**
 * One global banner while the browser is offline. Paused suspense queries keep their
 * skeleton, so the signal comes from `onlineManager`, not from a query.
 */
export function OfflineBanner() {
  const isOnline = useSyncExternalStore(subscribe, getIsOnline, getIsOnlineOnServer);

  return (
    <output className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4">
      {!isOnline && (
        <p className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm text-foreground shadow-lg">
          <WifiOff aria-hidden="true" className="size-4" />
          You are offline. Showing saved results.
        </p>
      )}
    </output>
  );
}

function subscribe(onChange: () => void): () => void {
  return onlineManager.subscribe(onChange);
}

function getIsOnline(): boolean {
  return onlineManager.isOnline();
}

function getIsOnlineOnServer(): boolean {
  return true;
}
