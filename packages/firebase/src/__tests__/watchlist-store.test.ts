import { server } from '@repo/test-utils';
import { getDoc, getDocs, setDoc, updateDoc, writeBatch } from 'firebase/firestore/lite';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createFolder,
  deleteFolder,
  getFolders,
  moveFolder,
  saveTitle,
  setTitleStatus,
} from '../watchlist-store';

vi.mock('firebase/app', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/app')>()),
  initializeApp: (options: object) => ({ options }),
}));

vi.mock('firebase/firestore/lite', () => ({
  arrayRemove: (...ids: string[]) => ({ arrayRemove: ids }),
  arrayUnion: (...ids: string[]) => ({ arrayUnion: ids }),
  collection: (_db: unknown, ...path: string[]) => ({ path: path.join('/') }),
  connectFirestoreEmulator: vi.fn(),
  doc: (first: { path?: string }, ...path: string[]) =>
    path.length > 0 ? { path: path.join('/') } : { path: `${first.path}/new` },
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  getFirestore: () => ({}),
  orderBy: vi.fn(),
  query: (ref: unknown) => ref,
  serverTimestamp: () => 'now',
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  writeBatch: vi.fn(),
}));

const batch = { commit: vi.fn(), delete: vi.fn(), update: vi.fn() };

type Row = { id: string } & Record<string, unknown>;

const FOLDERS: Row[] = [
  { id: 'a', name: 'A', parentId: null, depth: 1 },
  { id: 'b', name: 'B', parentId: 'a', depth: 2 },
  { id: 'd', name: 'D', parentId: null, depth: 1 },
];
const ITEMS: Row[] = [
  { id: 'movie_1', folderIds: ['b', 'd'] },
  { id: 'movie_2', folderIds: ['d'] },
  { id: 'movie_3', folderIds: ['b'] },
];

function toSnapshot(rows: Row[]) {
  return { docs: rows.map(({ id, ...data }) => ({ id, data: () => data })) };
}

function mockReads(): void {
  vi.mocked(getDocs).mockImplementation((async (ref: { path: string }) =>
    toSnapshot(ref.path.endsWith('folders') ? FOLDERS : ITEMS)) as never);
}

describe('watchlist store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(writeBatch).mockReturnValue(batch as never);
    server.use(
      http.get('*/__/firebase/init.json', () =>
        HttpResponse.json({ apiKey: 'key', projectId: 'cinepulse-test' })
      )
    );
    mockReads();
  });

  it('maps folder documents', async () => {
    await expect(getFolders('u')).resolves.toContainEqual({
      id: 'b',
      name: 'B',
      parentId: 'a',
      depth: 2,
    });
  });

  it('creates a folder one level below its parent', async () => {
    await createFolder('u', 'New', { id: 'b', name: 'B', parentId: 'a', depth: 2 });

    expect(setDoc).toHaveBeenCalledWith(expect.anything(), {
      name: 'New',
      parentId: 'b',
      depth: 3,
      createdAt: 'now',
    });
  });

  it('deletes the branch from a fresh read and keeps other folders on the titles', async () => {
    await deleteFolder('u', 'a');

    expect(getDocs).toHaveBeenCalledTimes(2);
    expect(batch.delete.mock.calls.map(([ref]) => ref.path)).toEqual([
      'users/u/folders/a',
      'users/u/folders/b',
    ]);
    expect(batch.update.mock.calls.map(([ref, data]) => [ref.path, data])).toEqual([
      ['users/u/items/movie_1', { folderIds: { arrayRemove: ['a', 'b'] } }],
      ['users/u/items/movie_3', { folderIds: { arrayRemove: ['a', 'b'] } }],
    ]);
    expect(batch.commit).toHaveBeenCalledOnce();
  });

  it('never deletes a title document', async () => {
    await deleteFolder('u', 'a');

    const deleted = batch.delete.mock.calls.map(([ref]) => ref.path as string);
    expect(deleted.filter((path) => path.includes('/items/'))).toEqual([]);
  });

  it('renumbers a moved branch in one batch', async () => {
    await moveFolder('u', 'a', 'd');

    expect(batch.update.mock.calls.map(([ref, data]) => [ref.path, data])).toEqual([
      ['users/u/folders/a', { parentId: 'd', depth: 2 }],
      ['users/u/folders/b', { parentId: 'a', depth: 3 }],
    ]);
    expect(batch.commit).toHaveBeenCalledOnce();
  });

  it('refuses a move the fresh tree no longer allows', async () => {
    await expect(moveFolder('u', 'a', 'b')).rejects.toMatchObject({ kind: 'client' });

    expect(batch.commit).not.toHaveBeenCalled();
  });

  it('writes only the status of a title, with no read', async () => {
    await setTitleStatus('u', 'movie_1', 'watched');

    expect(updateDoc).toHaveBeenCalledExactlyOnceWith(
      { path: 'users/u/items/movie_1' },
      { status: 'watched' }
    );
    expect(getDoc).not.toHaveBeenCalled();
    expect(getDocs).not.toHaveBeenCalled();
  });

  describe('saveTitle', () => {
    const TITLE = { mediaType: 'tv', tmdbId: 9, title: 'Dark', posterPath: '/dark.jpg' } as const;
    const REF = 'users/u/items/tv_9';

    function mockStored(exists: boolean): void {
      vi.mocked(getDoc).mockResolvedValue({ exists: () => exists } as never);
    }

    function getBatchWrites() {
      return batch.update.mock.calls.map(([ref, data]) => [ref.path, data]);
    }

    beforeEach(() => mockReads());

    it('creates a missing title with every field the rules require', async () => {
      mockStored(false);

      await saveTitle('u', TITLE, { added: ['a', 'd'], removed: [] });

      expect(vi.mocked(setDoc).mock.calls[0]).toEqual([
        { path: REF },
        { ...TITLE, status: 'planned', folderIds: ['a', 'd'], addedAt: 'now' },
      ]);
      expect(batch.commit).not.toHaveBeenCalled();
    });

    it('creates a title with no folder', async () => {
      mockStored(false);

      await saveTitle('u', TITLE, { added: [], removed: [] });

      expect(vi.mocked(setDoc).mock.calls[0]?.[1]).toMatchObject({ folderIds: [] });
    });

    it('changes a stored title with transforms and touches nothing else', async () => {
      mockStored(true);

      await saveTitle('u', TITLE, { added: ['a'], removed: ['b'] });

      expect(getBatchWrites()).toEqual([
        [REF, { folderIds: { arrayUnion: ['a'] } }],
        [REF, { folderIds: { arrayRemove: ['b'] } }],
      ]);
      expect(batch.commit).toHaveBeenCalledOnce();
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('writes only the side that changed', async () => {
      mockStored(true);

      await saveTitle('u', TITLE, { added: [], removed: ['b'] });

      expect(getBatchWrites()).toEqual([[REF, { folderIds: { arrayRemove: ['b'] } }]]);
    });

    it('refuses a folder deleted since the picker read it, and writes nothing', async () => {
      mockStored(true);

      await expect(
        saveTitle('u', TITLE, { added: ['a', 'gone'], removed: [] })
      ).rejects.toMatchObject({ kind: 'client' });

      expect(setDoc).not.toHaveBeenCalled();
      expect(batch.commit).not.toHaveBeenCalled();
    });

    it('reads no folders for a save that adds none', async () => {
      mockStored(true);

      await saveTitle('u', TITLE, { added: [], removed: ['b'] });

      expect(getDocs).not.toHaveBeenCalled();
    });

    it('reads the title fresh on every save', async () => {
      mockStored(true);

      await saveTitle('u', TITLE, { added: ['a'], removed: [] });
      await saveTitle('u', TITLE, { added: ['a'], removed: [] });

      expect(getDoc).toHaveBeenCalledTimes(2);
    });
  });

  it.each([
    ['unknown', 'network'],
    ['unavailable', 'network'],
    ['deadline-exceeded', 'network'],
    ['resource-exhausted', 'server'],
    ['permission-denied', 'client'],
  ])('reports the Firestore code %s as a %s error', async (code, kind) => {
    vi.mocked(getDocs).mockRejectedValueOnce(Object.assign(new Error('failed'), { code }));

    await expect(getFolders('u')).rejects.toMatchObject({ kind });
  });
});
