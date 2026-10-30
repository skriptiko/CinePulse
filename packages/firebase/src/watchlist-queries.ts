import { watchlistKey } from '@repo/api';
import { queryOptions } from '@tanstack/react-query';

/** Firestore stays out of the first load: only this small file is static (ADR-0010). */
export const loadWatchlistStore = () => import('./watchlist-store');

export const watchlistQueries = {
  all: watchlistKey,
  folders: (uid: string) =>
    queryOptions({
      queryKey: [...watchlistKey(uid), 'folders'] as const,
      queryFn: async () => (await loadWatchlistStore()).getFolders(uid),
    }),
  items: (uid: string) =>
    queryOptions({
      queryKey: [...watchlistKey(uid), 'items'] as const,
      queryFn: async () => (await loadWatchlistStore()).getItems(uid),
    }),
};
