/** The deepest level of the tree; `firestore.rules` holds the same limit. */
export const MAX_FOLDER_DEPTH = 6;

export type WatchlistFolder = {
  id: string;
  name: string;
  /** `null` for a top-level folder. */
  parentId: string | null;
  /** 1–6, the parent's depth plus one. */
  depth: number;
};

export type FolderRow = {
  folder: WatchlistFolder;
  /** 0 at the top level, whatever the stored `depth` says. */
  level: number;
};

export type FolderPlacement = Pick<WatchlistFolder, 'id' | 'parentId' | 'depth'>;

export type FolderMembership = {
  id: string;
  folderIds: string[];
};

/**
 * The tree as flat rows, depth-first by name. Rules cannot see a whole branch, so a hand-made
 * write can orphan a folder or close a loop (ADR-0010): such folders stay on the list.
 */
export function getFolderRows(folders: readonly WatchlistFolder[]): FolderRow[] {
  const sorted = [...folders].sort((a, b) => a.name.localeCompare(b.name));
  const ids = new Set(folders.map(({ id }) => id));
  const seen = new Set<string>();
  const rows: FolderRow[] = [];

  const visit = (folder: WatchlistFolder, level: number): void => {
    if (seen.has(folder.id)) return;
    seen.add(folder.id);
    rows.push({ folder, level });
    for (const child of sorted) {
      if (child.parentId === folder.id) visit(child, level + 1);
    }
  };

  for (const folder of sorted) {
    if (folder.parentId === null || !ids.has(folder.parentId)) visit(folder, 0);
  }
  // Only folders in a loop are left: none of them is reachable from the top level.
  for (const folder of sorted) visit(folder, 0);

  return rows;
}

/** The folder followed by all its descendants, parents before children. */
export function getBranch(
  folders: readonly WatchlistFolder[],
  folderId: string
): WatchlistFolder[] {
  const root = folders.find(({ id }) => id === folderId);
  if (!root) return [];

  const branch = [root];
  for (const parent of branch) {
    for (const folder of folders) {
      if (folder.parentId === parent.id && !branch.includes(folder)) branch.push(folder);
    }
  }
  return branch;
}

/** New places for a whole branch: rules check each document's depth against its parent. */
export function getMoveUpdates(
  folders: readonly WatchlistFolder[],
  folderId: string,
  parentId: string | null
): FolderPlacement[] {
  const parentDepth = folders.find(({ id }) => id === parentId)?.depth ?? 0;
  const depths = new Map([[parentId, parentDepth]]);

  return getBranch(folders, folderId).map((folder) => {
    const newParentId = folder.id === folderId ? parentId : folder.parentId;
    const depth = (depths.get(newParentId) ?? 0) + 1;
    depths.set(folder.id, depth);
    return { id: folder.id, parentId: newParentId, depth };
  });
}

/** `parentId: null` is the top level. Rules cannot see a branch, so this check is the client's. */
export function canMoveFolder(
  folders: readonly WatchlistFolder[],
  folderId: string,
  parentId: string | null
): boolean {
  const folder = folders.find(({ id }) => id === folderId);
  if (!folder || folder.parentId === parentId) return false;

  const hasTarget = parentId === null || folders.some(({ id }) => id === parentId);
  const isOwnBranch = getBranch(folders, folderId).some(({ id }) => id === parentId);
  if (!hasTarget || isOwnBranch) return false;

  return getMoveUpdates(folders, folderId, parentId).every(
    ({ depth }) => depth <= MAX_FOLDER_DEPTH
  );
}

export function canAddSubfolder(folder: WatchlistFolder): boolean {
  return folder.depth < MAX_FOLDER_DEPTH;
}

/** Titles that were in the deleted folders, without them. A title with no folder stays listed. */
export function getFolderIdUpdates(
  items: readonly FolderMembership[],
  deletedIds: readonly string[]
): FolderMembership[] {
  const deleted = new Set(deletedIds);

  return items.flatMap(({ id, folderIds }) => {
    const kept = folderIds.filter((folderId) => !deleted.has(folderId));
    return kept.length === folderIds.length ? [] : [{ id, folderIds: kept }];
  });
}
