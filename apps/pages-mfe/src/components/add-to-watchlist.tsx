import { createTypedEmitter } from '@repo/events';
import type { WatchlistTitle } from '@repo/firebase';
import { Button, type MovieCardData } from '@repo/ui';
import { Bookmark, Loader2 } from 'lucide-react';
import { useRef, useState, useTransition } from 'react';
import type { WatchlistDialog } from './watchlist-dialog';

const emitNotification = createTypedEmitter('notification:show');

/** One dialog at a time: during a slow first download, every other card can still be pressed. */
let isLoadingDialog = false;

export type AddToWatchlistProps = {
  title: WatchlistTitle;
  /** The details page has room for words; a poster has room for an icon. */
  showLabel?: boolean;
};

/**
 * On every catalog page, for anonymous visitors too, so everything else loads on the first press:
 * a static `Dialog` adds 15 kB to Home. `import()` and not `lazy`: a chunk that stays unavailable
 * ends in a toast here, and under `lazy` it would reach the boundary of the whole row or page.
 */
export function AddToWatchlist({ title, showLabel = false }: AddToWatchlistProps) {
  // `null` while closed, so a closed dialog costs nothing.
  const [Dialog, setDialog] = useState<typeof WatchlistDialog | null>(null);
  const [isOpening, startOpening] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const Icon = isOpening ? Loader2 : Bookmark;

  const open = async (): Promise<void> => {
    if (isLoadingDialog) return;
    isLoadingDialog = true;
    try {
      const { WatchlistDialog } = await import('./watchlist-dialog');
      setDialog(() => WatchlistDialog);
    } catch {
      emitNotification({
        type: 'error',
        message: 'The watchlist could not be opened. Reload the page and try again.',
      });
    } finally {
      isLoadingDialog = false;
    }
  };

  return (
    <>
      <Button
        ref={triggerRef}
        aria-haspopup="dialog"
        aria-label={showLabel ? undefined : `Add ${title.title} to your watchlist`}
        variant={showLabel ? 'secondary' : 'ghost'}
        size={showLabel ? 'lg' : 'icon-sm'}
        className={showLabel ? 'touch-target' : 'glass rounded-full'}
        onClick={() => startOpening(open)}
      >
        <Icon aria-hidden="true" className={isOpening ? 'animate-spin' : undefined} />
        {showLabel && 'Add to watchlist'}
      </Button>
      {Dialog !== null && (
        <Dialog
          title={title}
          onClose={() => setDialog(null)}
          // The page was locked, so the button is where it was: no scrolling, for a mouse above all.
          onCloseAutoFocus={() => triggerRef.current?.focus({ preventScroll: true })}
        />
      )}
    </>
  );
}

/** For `ContentRow` and the movies grid. */
export function renderAddToWatchlist({ id, title, mediaType, posterPath }: MovieCardData) {
  return <AddToWatchlist title={{ mediaType, tmdbId: id, title, posterPath }} />;
}
