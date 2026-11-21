import type { WatchlistItem } from '@repo/firebase';
import type { WatchlistFolder } from '@repo/firebase/watchlist-tree';
import { describe, expect, it } from 'vitest';
import { toCsvExport, toJsonExport } from '../watchlist-export';

const EXPORTED_AT = new Date('2026-11-21T09:30:00Z');

const FOLDERS: WatchlistFolder[] = [
  { id: 'horror', name: 'Horror', parentId: null, depth: 1 },
  { id: 'slashers', name: 'Slashers', parentId: 'horror', depth: 2 },
  { id: 'drama', name: 'Drama', parentId: null, depth: 1 },
];

const ITEMS: WatchlistItem[] = [
  {
    id: 'movie_1',
    mediaType: 'movie',
    tmdbId: 1,
    title: 'Scream',
    posterPath: '/scream.jpg',
    status: 'watched',
    folderIds: ['slashers', 'drama'],
    addedAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'tv_2',
    mediaType: 'tv',
    tmdbId: 2,
    title: 'Lost',
    posterPath: null,
    status: 'planned',
    folderIds: [],
    addedAt: null,
  },
];

describe('toJsonExport', () => {
  it('names the file by the export date', () => {
    const file = toJsonExport(FOLDERS, ITEMS, EXPORTED_AT);

    expect(file.name).toBe('cinepulse-watchlist-2026-11-21.json');
    expect(file.type).toBe('application/json');
  });

  it('holds the folder tree and every title with its folders', () => {
    const data = JSON.parse(toJsonExport(FOLDERS, ITEMS, EXPORTED_AT).content);

    expect(data).toEqual({
      app: 'CinePulse',
      version: 1,
      exportedAt: '2026-11-21T09:30:00.000Z',
      folders: [
        { id: 'drama', name: 'Drama', folders: [] },
        {
          id: 'horror',
          name: 'Horror',
          folders: [{ id: 'slashers', name: 'Slashers', folders: [] }],
        },
      ],
      titles: [
        {
          tmdbId: 1,
          mediaType: 'movie',
          title: 'Scream',
          status: 'watched',
          addedAt: '2026-11-01T10:00:00.000Z',
          folderIds: ['slashers', 'drama'],
        },
        {
          tmdbId: 2,
          mediaType: 'tv',
          title: 'Lost',
          status: 'planned',
          addedAt: null,
          folderIds: [],
        },
      ],
    });
  });

  it('keeps an orphaned folder and a loop at the top level', () => {
    const broken: WatchlistFolder[] = [
      { id: 'orphan', name: 'Orphan', parentId: 'gone', depth: 2 },
      { id: 'a', name: 'A', parentId: 'b', depth: 2 },
      { id: 'b', name: 'B', parentId: 'a', depth: 2 },
    ];

    const { folders } = JSON.parse(toJsonExport(broken, [], EXPORTED_AT).content);

    expect(folders).toEqual([
      { id: 'orphan', name: 'Orphan', folders: [] },
      { id: 'a', name: 'A', folders: [{ id: 'b', name: 'B', folders: [] }] },
    ]);
  });
});

describe('toCsvExport', () => {
  it('writes a header and one row per title, with every folder path', () => {
    const file = toCsvExport(FOLDERS, ITEMS, EXPORTED_AT);

    expect(file.name).toBe('cinepulse-watchlist-2026-11-21.csv');
    expect(file.type).toBe('text/csv;charset=utf-8');
    expect(file.content).toBe(
      '﻿title,media_type,tmdb_id,status,added_at,folders\r\n' +
        'Scream,movie,1,watched,2026-11-01T10:00:00.000Z,Horror / Slashers; Drama\r\n' +
        'Lost,tv,2,planned,,\r\n'
    );
  });

  it('quotes commas, quotes and line breaks', () => {
    const item = { ...ITEMS[1], title: 'Say "Hi", Bye\nNow' } as WatchlistItem;

    const [, row] = toCsvExport([], [item], EXPORTED_AT).content.split('\r\n');

    expect(row).toBe('"Say ""Hi"", Bye\nNow",tv,2,planned,,');
  });

  it('keeps a cell that looks like a formula as text', () => {
    const item = { ...ITEMS[1], title: '=HYPERLINK("x")' } as WatchlistItem;

    const [, row] = toCsvExport([], [item], EXPORTED_AT).content.split('\r\n');

    expect(row).toBe(`"'=HYPERLINK(""x"")",tv,2,planned,,`);
  });

  it('stops a folder path at a loop', () => {
    const loop: WatchlistFolder[] = [
      { id: 'a', name: 'A', parentId: 'b', depth: 2 },
      { id: 'b', name: 'B', parentId: 'a', depth: 2 },
    ];
    const item = { ...ITEMS[1], folderIds: ['a'] } as WatchlistItem;

    const [, row] = toCsvExport(loop, [item], EXPORTED_AT).content.split('\r\n');

    expect(row).toBe('Lost,tv,2,planned,,B / A');
  });
});

describe('export speed', () => {
  it('builds both files for 1,000 titles in under a second', () => {
    const items = Array.from({ length: 1000 }, (_, index) => ({
      ...ITEMS[0],
      id: `movie_${index}`,
      tmdbId: index,
    })) as WatchlistItem[];

    const start = performance.now();
    toJsonExport(FOLDERS, items, EXPORTED_AT);
    toCsvExport(FOLDERS, items, EXPORTED_AT);

    expect(performance.now() - start).toBeLessThan(1000);
  });
});
