import { describe, expect, it } from 'vitest';
import {
  canAddSubfolder,
  canMoveFolder,
  getBranch,
  getFolderIdUpdates,
  getFolderRows,
  getMoveUpdates,
  MAX_FOLDER_DEPTH,
  type WatchlistFolder,
} from '../watchlist-tree';

function folder(id: string, parentId: string | null, depth: number): WatchlistFolder {
  return { id, name: id, parentId, depth };
}

/** a > b > c, and d beside a. */
const TREE = [folder('c', 'b', 3), folder('d', null, 1), folder('b', 'a', 2), folder('a', null, 1)];

function chain(length: number): WatchlistFolder[] {
  return Array.from({ length }, (_, index) =>
    folder(`f${index + 1}`, index === 0 ? null : `f${index}`, index + 1)
  );
}

describe('getFolderRows', () => {
  it('lists folders depth-first by name, with their level', () => {
    expect(getFolderRows(TREE).map(({ folder: { id }, level }) => [id, level])).toEqual([
      ['a', 0],
      ['b', 1],
      ['c', 2],
      ['d', 0],
    ]);
  });

  it('keeps a folder whose parent is gone at the top level', () => {
    expect(getFolderRows([folder('x', 'missing', 3)])).toEqual([
      { folder: folder('x', 'missing', 3), level: 0 },
    ]);
  });

  it('keeps folders caught in a loop', () => {
    const loop = [folder('x', 'y', 2), folder('y', 'x', 3)];

    expect(getFolderRows(loop).map(({ folder: { id } }) => id)).toEqual(['x', 'y']);
  });
});

describe('getBranch', () => {
  it('returns the folder and all its descendants', () => {
    expect(getBranch(TREE, 'a').map(({ id }) => id)).toEqual(['a', 'b', 'c']);
  });

  it('stops at a loop', () => {
    const loop = [folder('x', 'y', 2), folder('y', 'x', 3)];

    expect(getBranch(loop, 'x').map(({ id }) => id)).toEqual(['x', 'y']);
  });
});

describe('canMoveFolder', () => {
  it('allows a move to another folder and to the top level', () => {
    expect(canMoveFolder(TREE, 'b', 'd')).toBe(true);
    expect(canMoveFolder(TREE, 'b', null)).toBe(true);
  });

  it('refuses a move into the folder itself or its own branch', () => {
    expect(canMoveFolder(TREE, 'a', 'a')).toBe(false);
    expect(canMoveFolder(TREE, 'a', 'c')).toBe(false);
  });

  it('refuses a move to the current parent', () => {
    expect(canMoveFolder(TREE, 'b', 'a')).toBe(false);
    expect(canMoveFolder(TREE, 'a', null)).toBe(false);
  });

  it('refuses a move to a folder that no longer exists', () => {
    expect(canMoveFolder(TREE, 'b', 'gone')).toBe(false);
  });

  it('refuses a move that takes the deepest descendant past the limit', () => {
    const tree = [...chain(MAX_FOLDER_DEPTH), folder('x', null, 1), folder('y', 'x', 2)];

    expect(canMoveFolder(tree, 'x', 'f5')).toBe(false);
    expect(canMoveFolder(tree, 'y', 'f5')).toBe(true);
  });
});

describe('getMoveUpdates', () => {
  it('reparents the root and renumbers every descendant', () => {
    expect(getMoveUpdates(TREE, 'b', 'd')).toEqual([
      { id: 'b', parentId: 'd', depth: 2 },
      { id: 'c', parentId: 'b', depth: 3 },
    ]);
    expect(getMoveUpdates(TREE, 'b', null)).toEqual([
      { id: 'b', parentId: null, depth: 1 },
      { id: 'c', parentId: 'b', depth: 2 },
    ]);
  });
});

describe('canAddSubfolder', () => {
  it('allows a subfolder down to the last level only', () => {
    expect(canAddSubfolder(folder('x', null, MAX_FOLDER_DEPTH - 1))).toBe(true);
    expect(canAddSubfolder(folder('x', null, MAX_FOLDER_DEPTH))).toBe(false);
  });
});

describe('getFolderIdUpdates', () => {
  it('drops only the deleted folders from the titles that were in them', () => {
    const items = [
      { id: 'movie_1', folderIds: ['a', 'd'] },
      { id: 'movie_2', folderIds: ['a'] },
      { id: 'movie_3', folderIds: ['d'] },
    ];

    expect(getFolderIdUpdates(items, ['a', 'b'])).toEqual([
      { id: 'movie_1', folderIds: ['d'] },
      { id: 'movie_2', folderIds: [] },
    ]);
  });
});
