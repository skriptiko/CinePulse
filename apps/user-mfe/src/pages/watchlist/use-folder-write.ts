import { loadWatchlistStore } from '@repo/firebase';
import { type QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

export type WatchlistStore = Awaited<ReturnType<typeof loadWatchlistStore>>;

export type FolderWriteOptions<T> = {
  write: (store: WatchlistStore, value: T) => Promise<void>;
  /** What the write can change: a title list costs one read per title. */
  invalidate: QueryKey;
  /** Runs once the write lands, and only while the form is still on screen. */
  onDone: () => void;
};

/** Failures reach the user through `MutationCache.onError`; the open form keeps its input. */
export function useFolderWrite<T>({ write, invalidate, onDone }: FolderWriteOptions<T>) {
  const queryClient = useQueryClient();
  const submitRef = useRef<HTMLButtonElement>(null);
  const { mutate, isPending, isError } = useMutation({
    mutationFn: async (value: T) => write(await loadWatchlistStore(), value),
    // Lite has no write queue: offline, a write fails at once instead of pausing with the form locked.
    networkMode: 'always',
    // After a failure too: a rejected write usually means this tab's tree is out of date.
    // Not awaited: the form stays locked until this returns, and a refetch can retry for seconds.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: invalidate });
    },
  });

  // The disabled button dropped focus; a failed write enables it again.
  useEffect(() => {
    if (isError && document.activeElement === document.body) submitRef.current?.focus();
  }, [isError]);

  // A per-call callback, which React Query skips after unmount: someone who left mid-write stays.
  const submit = (value: T) => mutate(value, { onSuccess: onDone });

  return { submit, isPending, submitRef };
}
