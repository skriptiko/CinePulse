import type { WatchlistItem } from '@repo/firebase';
import type { WatchlistFolder } from '@repo/firebase/watchlist-tree';

/** Raised when the layout of the JSON file changes, so a reader can tell the versions apart. */
const EXPORT_VERSION = 1;
const CSV_COLUMNS = ['title', 'media_type', 'tmdb_id', 'status', 'added_at', 'folders'];
/** Between the paths of a title that sits in several folders. */
const PATH_SEPARATOR = '; ';
/** A spreadsheet runs a cell that starts with one of these as a formula (OWASP, CSV injection). */
const FORMULA_START = /^[=+\-@\t\r]/;

type FolderNode = {
  id: string;
  name: string;
  folders: FolderNode[];
};

export type ExportFile = {
  name: string;
  type: string;
  content: string;
};

/** The full tree and every title with its folders, for a person or a program to read back. */
export function toJsonExport(
  folders: readonly WatchlistFolder[],
  items: readonly WatchlistItem[],
  exportedAt: Date
): ExportFile {
  const data = {
    app: 'CinePulse',
    version: EXPORT_VERSION,
    exportedAt: exportedAt.toISOString(),
    folders: buildTree(folders),
    titles: items.map((item) => ({
      tmdbId: item.tmdbId,
      mediaType: item.mediaType,
      title: item.title,
      status: item.status,
      addedAt: item.addedAt,
      folderIds: item.folderIds,
    })),
  };
  return {
    name: getFileName(exportedAt, 'json'),
    type: 'application/json',
    content: `${JSON.stringify(data, null, 2)}\n`,
  };
}

/** One row per title; a title in several folders lists every path in one cell. */
export function toCsvExport(
  folders: readonly WatchlistFolder[],
  items: readonly WatchlistItem[],
  exportedAt: Date
): ExportFile {
  const paths = getFolderPaths(folders);
  const rows = items.map((item) => [
    item.title,
    item.mediaType,
    String(item.tmdbId),
    item.status,
    item.addedAt ?? '',
    item.folderIds.flatMap((id) => paths.get(id) ?? []).join(PATH_SEPARATOR),
  ]);
  const lines = [CSV_COLUMNS, ...rows].map((row) => row.map(toCsvCell).join(','));
  return {
    name: getFileName(exportedAt, 'csv'),
    type: 'text/csv;charset=utf-8',
    // The byte order mark makes Excel read the file as UTF-8.
    content: `﻿${lines.join('\r\n')}\r\n`,
  };
}

function getFileName(exportedAt: Date, extension: string): string {
  return `cinepulse-watchlist-${exportedAt.toISOString().slice(0, 10)}.${extension}`;
}

function toCsvCell(value: string): string {
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/**
 * Folders by parent. A folder whose parent is gone, or one inside a loop (ADR-0010), goes to the
 * top level, so the file still holds every folder.
 */
function buildTree(folders: readonly WatchlistFolder[]): FolderNode[] {
  const sorted = [...folders].sort((a, b) => a.name.localeCompare(b.name));
  const placed = new Set<string>();
  const visit = (folder: WatchlistFolder): FolderNode => {
    placed.add(folder.id);
    const children = sorted.filter(
      (child) => child.parentId === folder.id && !placed.has(child.id)
    );
    return { id: folder.id, name: folder.name, folders: children.map(visit) };
  };
  const ids = new Set(folders.map(({ id }) => id));
  const roots = sorted.filter(({ parentId }) => parentId === null || !ids.has(parentId)).map(visit);
  for (const folder of sorted) if (!placed.has(folder.id)) roots.push(visit(folder));
  return roots;
}

/** `Horror / Slashers` for each folder id, stopping at a missing parent or a loop. */
function getFolderPaths(folders: readonly WatchlistFolder[]): Map<string, string> {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const paths = new Map<string, string>();
  for (const folder of folders) {
    const names: string[] = [];
    const seen = new Set<string>();
    let current: WatchlistFolder | undefined = folder;
    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      names.unshift(current.name);
      current = current.parentId === null ? undefined : byId.get(current.parentId);
    }
    paths.set(folder.id, names.join(' / '));
  }
  return paths;
}
