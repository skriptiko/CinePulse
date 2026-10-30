import { server } from '@repo/test-utils';
import { getDocs, setDoc, writeBatch } from 'firebase/firestore/lite';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFolder, deleteFolder, getFolders, moveFolder } from '../watchlist-store';

vi.mock('firebase/app', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/app')>()),
  initializeApp: (options: object) => ({ options }),
}));

vi.mock('firebase/firestore/lite', () => ({
  arrayRemove: (...ids: string[]) => ({ arrayRemove: ids }),
  collection: (_db: unknown, ...path: string[]) => ({ path: path.join('/') }),
  connectFirestoreEmulator: vi.fn(),
  doc: (first: { path?: string }, ...path: string[]) =>
    path.length > 0 ? { path: path.join('/') } : { path: `${first.path}/new` },
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

  it.each([
    ['unknown', 'network'],
    ['unavailable', 'network'],
    ['deadline-exceeded', 'network'],
    ['permission-denied', 'client'],
  ])('reports the Firestore code %s as a %s error', async (code, kind) => {
    vi.mocked(getDocs).mockRejectedValueOnce(Object.assign(new Error('failed'), { code }));

    await expect(getFolders('u')).rejects.toMatchObject({ kind });
  });
});
