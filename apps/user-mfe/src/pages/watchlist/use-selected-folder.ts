import type { WatchlistFolder } from '@repo/firebase/watchlist-tree';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

const FOLDER_PARAM = 'folder';

/** The search string of a folder, other params kept; `null` is All titles, which has no param. */
export function getFolderSearch(folderId: string | null, searchParams: URLSearchParams): string {
  const next = new URLSearchParams(searchParams);
  if (folderId === null) next.delete(FOLDER_PARAM);
  else next.set(FOLDER_PARAM, folderId);
  const search = next.toString();
  return search === '' ? '' : `?${search}`;
}

/** An unknown id (a stale link, a folder deleted elsewhere) reads as All titles. */
export function useSelectedFolder(folders: readonly WatchlistFolder[]) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selected = folders.find(({ id }) => id === searchParams.get(FOLDER_PARAM)) ?? null;

  // A delete lands after its render: the params it started with would drop a filter pressed since.
  const latestParamsRef = useRef(searchParams);
  useEffect(() => {
    latestParamsRef.current = searchParams;
  }, [searchParams]);

  // Replaces the entry: Back must not lead to a folder that is gone.
  function replaceSelection(folderId: string | null): void {
    setSearchParams(getFolderSearch(folderId, latestParamsRef.current), { replace: true });
  }

  return { selected, replaceSelection };
}
