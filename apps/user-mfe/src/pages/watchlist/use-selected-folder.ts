import type { WatchlistFolder } from '@repo/firebase/watchlist-tree';
import { useSearchParams } from 'react-router-dom';

const FOLDER_PARAM = 'folder';

/** The search string of a folder; `null` is All titles, which has no parameter. */
export function getFolderSearch(folderId: string | null): string {
  return folderId === null ? '' : `?${FOLDER_PARAM}=${folderId}`;
}

/** An unknown id (a stale link, a folder deleted elsewhere) reads as All titles. */
export function useSelectedFolder(folders: readonly WatchlistFolder[]) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selected = folders.find(({ id }) => id === searchParams.get(FOLDER_PARAM)) ?? null;

  // Replaces the entry: Back must not lead to a folder that is gone.
  function replaceSelection(folderId: string | null): void {
    setSearchParams(getFolderSearch(folderId), { replace: true });
  }

  return { selected, replaceSelection };
}
