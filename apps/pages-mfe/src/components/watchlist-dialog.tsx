import { createTypedEmitter, useGlobalStore } from '@repo/events';
import {
  type FolderChanges,
  loadWatchlistStore,
  type WatchlistTitle,
  watchlistQueries,
} from '@repo/firebase';
import { getFolderRows } from '@repo/firebase/watchlist-tree';
import { ROUTE_PATHS } from '@repo/routes';
import { AsyncBoundary, Button, buttonVariants, Dialog, DialogContent, Skeleton } from '@repo/ui';
import { useMutation, useQueryClient, useSuspenseQueries } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import type { FallbackProps } from 'react-error-boundary';
import { Link, useLocation } from 'react-router-dom';

const emitNotification = createTypedEmitter('notification:show');

export type WatchlistDialogProps = {
  title: WatchlistTitle;
  onClose: () => void;
  onCloseAutoFocus: () => void;
};

/** Loaded on the first press; the only runtime path to `@repo/firebase` in this app. */
export function WatchlistDialog({ title, onClose, onCloseAutoFocus }: WatchlistDialogProps) {
  const uid = useGlobalStore((state) => state.user?.uid);
  const isAnonymous = useGlobalStore((state) => state.authStatus === 'anonymous');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        title={
          isAnonymous ? `Sign in to save ${title.title}` : `Add ${title.title} to your watchlist`
        }
        description={
          isAnonymous
            ? 'Your watchlist keeps titles in your own folders.'
            : 'Pick folders, or none to keep it under All titles.'
        }
        onCloseAutoFocus={onCloseAutoFocus}
      >
        {isAnonymous && <SignInOffer />}
        {/* A known session is still restoring: the press is kept, and this resolves on its own. */}
        {!isAnonymous && uid === undefined && <PickerSkeleton />}
        {uid !== undefined && (
          <AsyncBoundary fallback={<PickerSkeleton />} errorFallback={PickerError}>
            <FolderPicker uid={uid} title={title} onClose={onClose} />
          </AsyncBoundary>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SignInOffer() {
  const { pathname, search } = useLocation();

  return (
    <Link
      to={ROUTE_PATHS.AUTH_LOGIN}
      state={{ from: pathname + search }}
      className={buttonVariants({ size: 'sm', className: 'touch-target self-start' })}
    >
      Sign in
    </Link>
  );
}

function PickerSkeleton() {
  return (
    <output aria-busy="true" className="flex flex-col gap-2">
      <span className="sr-only">Loading your folders</span>
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </output>
  );
}

function PickerError({ resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <p className="text-muted-foreground text-sm">Your folders could not be loaded.</p>
      <Button variant="outline" size="sm" className="touch-target" onClick={resetErrorBoundary}>
        Try again
      </Button>
    </div>
  );
}

type FolderPickerProps = {
  uid: string;
  title: WatchlistTitle;
  onClose: () => void;
};

function FolderPicker({ uid, title, onClose }: FolderPickerProps) {
  const [{ data: folders }, { data: items }] = useSuspenseQueries({
    queries: [watchlistQueries.folders(uid), watchlistQueries.items(uid)],
  });
  // What the person changed, not a copy of the server's list: a refetch cannot undo a tick.
  const [choices, setChoices] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();
  const submitRef = useRef<HTMLButtonElement>(null);
  const isWritingRef = useRef(false);
  const { mutate, isPending, isError } = useMutation({
    mutationFn: async (changes: FolderChanges) =>
      (await loadWatchlistStore()).saveTitle(uid, title, changes),
    // Lite has no write queue: offline, a write fails at once instead of pausing with the form locked.
    networkMode: 'always',
    // Here and not on `mutate`: someone who left mid-write still hears that it landed.
    onSuccess: () =>
      emitNotification({ type: 'success', message: `${title.title} is in your watchlist` }),
    // `refetchType`: the dialog may be closed by now, and the next look must not start stale. Folders
    // too, as a save fails on one deleted elsewhere and its row must go before a retry.
    // Not awaited: the form stays locked until this returns, and a refetch can retry for seconds.
    onSettled: () => {
      isWritingRef.current = false;
      void queryClient.invalidateQueries({
        queryKey: watchlistQueries.all(uid),
        refetchType: 'all',
      });
    },
  });

  // The disabled button dropped focus; a failed write enables it again.
  useEffect(() => {
    if (isError && document.activeElement === document.body) submitRef.current?.focus();
  }, [isError]);

  const saved = items.find(
    ({ mediaType, tmdbId }) => mediaType === title.mediaType && tmdbId === title.tmdbId
  );
  const savedIds = new Set(saved?.folderIds);
  const liveIds = new Set(folders.map(({ id }) => id));
  const getChangedIds = (isIn: boolean): string[] =>
    Object.keys(choices).filter(
      (id) => liveIds.has(id) && choices[id] === isIn && savedIds.has(id) !== isIn
    );
  const changes = { added: getChangedIds(true), removed: getChangedIds(false) };
  const hasWrite = saved === undefined || changes.added.length + changes.removed.length > 0;
  const rows = getFolderRows(folders);

  function handleSave(): void {
    // `isPending` disables the button a tick late, and rules would refuse a second create.
    if (isWritingRef.current || !hasWrite) return;
    isWritingRef.current = true;
    // A per-call callback, which React Query skips after unmount.
    mutate(changes, { onSuccess: onClose });
  }

  return (
    // No `<form>`: Enter on a checkbox would submit it, adding the title with what is ticked so far.
    <div className="flex flex-col gap-4">
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No folders yet. Create them in your watchlist.
        </p>
      ) : (
        <fieldset disabled={isPending} className="min-w-0">
          <legend className="sr-only">Folders</legend>
          {/* Scrolling on the fieldset let rows run under the buttons. `p-1` keeps focus rings. */}
          <div className="max-h-[40svh] overflow-y-auto p-1">
            {rows.map(({ folder, level }) => (
              <label
                key={folder.id}
                className="touch-target flex items-center gap-2 py-1.5 text-sm"
                style={{ paddingInlineStart: `${level}rem` }}
              >
                <input
                  type="checkbox"
                  aria-label={`${folder.name}, level ${level + 1}`}
                  checked={choices[folder.id] ?? savedIds.has(folder.id)}
                  className="accent-primary size-4 shrink-0"
                  onChange={(event) =>
                    setChoices({ ...choices, [folder.id]: event.target.checked })
                  }
                />
                <span className="min-w-0 break-words">{folder.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          ref={submitRef}
          size="sm"
          disabled={!hasWrite || isPending}
          className="touch-target"
          onClick={handleSave}
        >
          {getSubmitLabel(isPending, saved !== undefined)}
        </Button>
        <Link
          to={ROUTE_PATHS.USER_WATCHLIST}
          className={buttonVariants({
            variant: 'link',
            size: 'sm',
            className: 'touch-target ml-auto',
          })}
        >
          Open watchlist
        </Link>
      </div>
    </div>
  );
}

function getSubmitLabel(isPending: boolean, isSaved: boolean): string {
  if (isPending) return 'Saving...';
  return isSaved ? 'Save' : 'Add to watchlist';
}
