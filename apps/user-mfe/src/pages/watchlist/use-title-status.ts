import { loadWatchlistStore, type WatchStatus, watchlistQueries } from '@repo/firebase';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * One per row, as `variables` follows a single call. The cache only ever holds what the server
 * accepted, so a failure has nothing to roll back, and a change costs no read of every title
 * (ADR-0015).
 */
export function useTitleStatus(uid: string, titleId: string) {
  const queryClient = useQueryClient();
  const { queryKey } = watchlistQueries.items(uid);

  return useMutation({
    mutationFn: async (status: WatchStatus) =>
      (await loadWatchlistStore()).setTitleStatus(uid, titleId, status),
    // The writes of a title run in order, so the last press is the last write.
    scope: { id: titleId },
    // Lite has no write queue: offline, a write fails at once instead of pausing.
    networkMode: 'always',
    onSuccess: async (_result, status) => {
      // A read from before the commit must not bring the old status back, but it can carry
      // another change, such as a title just added. The patch also marks `items` fresh, so a read
      // that is running, paused or owed runs again.
      const query = queryClient.getQueryState(queryKey);
      const owesRead = query !== undefined && (query.fetchStatus !== 'idle' || query.isInvalidated);
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData(queryKey, (items) =>
        items?.map((item) => (item.id === titleId ? { ...item, status } : item))
      );
      if (owesRead) void queryClient.invalidateQueries({ queryKey });
    },
    // The title may be gone, or changed elsewhere.
    onError: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
