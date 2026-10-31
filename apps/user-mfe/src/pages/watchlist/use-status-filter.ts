import type { WatchStatus } from '@repo/firebase';

// Here and not in `@repo/firebase`: a value on its entry would reach anonymous visitors.
export const WATCH_STATUSES = ['planned', 'watched'] as const satisfies readonly WatchStatus[];

export const STATUS_LABELS: Record<WatchStatus, string> = {
  planned: 'Planned',
  watched: 'Watched',
};

export function isWatchStatus(value: string): value is WatchStatus {
  return WATCH_STATUSES.some((status) => status === value);
}
