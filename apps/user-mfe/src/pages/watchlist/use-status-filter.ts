import type { WatchStatus } from '@repo/firebase';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const STATUS_PARAM = 'status';

// Here and not in `@repo/firebase`: a value on its entry would reach anonymous visitors.
export const WATCH_STATUSES = ['planned', 'watched'] as const satisfies readonly WatchStatus[];

export const STATUS_LABELS: Record<WatchStatus, string> = {
  planned: 'Planned',
  watched: 'Watched',
};

export function isWatchStatus(value: string): value is WatchStatus {
  return WATCH_STATUSES.some((status) => status === value);
}

/** The filter lives in the URL; a missing or unknown value reads as every status. */
export function useStatusFilter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(STATUS_PARAM);
  const statusFilter = value !== null && isWatchStatus(value) ? value : null;

  function setStatusFilter(status: WatchStatus | null): void {
    if (status === statusFilter) return;
    const next = new URLSearchParams(searchParams);
    if (status === null) next.delete(STATUS_PARAM);
    else next.set(STATUS_PARAM, status);
    setSearchParams(next);
  }

  return { statusFilter, setStatusFilter };
}

/**
 * A row changed under a filter stays until the view changes. If it left at once, the next row would
 * move under the finger, and the second tap of a double tap would change that title.
 */
export function useKeptRows(view: string) {
  const [kept, setKept] = useState({ view, ids: [] as string[] });

  // During the render, so that a row kept here does not come back with this view.
  if (kept.view !== view) setKept({ view, ids: [] });

  function keepRow(id: string): void {
    setKept((current) => ({ ...current, ids: [...current.ids, id] }));
  }

  return { keptIds: kept.ids, keepRow };
}
