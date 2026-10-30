import { ApiError } from '@repo/api';
import {
  arrayRemove,
  collection,
  connectFirestoreEmulator,
  doc,
  type Firestore,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore/lite';
import { getFirebaseApp, isDemoProject } from './app';
import { toApiError } from './errors';
import {
  canMoveFolder,
  getBranch,
  getFolderIdUpdates,
  getMoveUpdates,
  type WatchlistFolder,
} from './watchlist-tree';

const FIRESTORE_EMULATOR_PORT = 5012;

export type WatchStatus = 'watched' | 'planned';

export type WatchlistItem = {
  id: string;
  mediaType: 'movie' | 'tv';
  tmdbId: number;
  title: string;
  posterPath: string | null;
  status: WatchStatus;
  folderIds: string[];
};

let firestore: Promise<Firestore> | undefined;

function getDb(): Promise<Firestore> {
  firestore ??= connect().catch((error: unknown) => {
    firestore = undefined;
    throw error;
  });
  return firestore;
}

async function connect(): Promise<Firestore> {
  const app = await getFirebaseApp();
  const db = getFirestore(app);
  if (isDemoProject(app)) connectFirestoreEmulator(db, '127.0.0.1', FIRESTORE_EMULATOR_PORT);
  return db;
}

async function readFolders(db: Firestore, uid: string): Promise<WatchlistFolder[]> {
  const { docs } = await getDocs(collection(db, 'users', uid, 'folders'));
  return docs.map((snapshot) => {
    const { name, parentId, depth } = snapshot.data();
    return { id: snapshot.id, name, parentId, depth };
  });
}

async function readItems(db: Firestore, uid: string): Promise<WatchlistItem[]> {
  const { docs } = await getDocs(
    query(collection(db, 'users', uid, 'items'), orderBy('addedAt', 'desc'))
  );
  return docs.map((snapshot) => {
    const { mediaType, tmdbId, title, posterPath, status, folderIds } = snapshot.data();
    return { id: snapshot.id, mediaType, tmdbId, title, posterPath, status, folderIds };
  });
}

async function run<T>(request: (db: Firestore) => Promise<T>): Promise<T> {
  try {
    return await request(await getDb());
  } catch (error) {
    throw toApiError(error);
  }
}

export function getFolders(uid: string): Promise<WatchlistFolder[]> {
  return run((db) => readFolders(db, uid));
}

export function getItems(uid: string): Promise<WatchlistItem[]> {
  return run((db) => readItems(db, uid));
}

export function createFolder(
  uid: string,
  name: string,
  parent: WatchlistFolder | null
): Promise<void> {
  return run((db) =>
    setDoc(doc(collection(db, 'users', uid, 'folders')), {
      name,
      parentId: parent?.id ?? null,
      depth: (parent?.depth ?? 0) + 1,
      createdAt: serverTimestamp(),
    })
  );
}

export function renameFolder(uid: string, folderId: string, name: string): Promise<void> {
  return run((db) => updateDoc(doc(db, 'users', uid, 'folders', folderId), { name }));
}

export function moveFolder(uid: string, folderId: string, parentId: string | null): Promise<void> {
  return run(async (db) => {
    const folders = await readFolders(db, uid);
    if (!canMoveFolder(folders, folderId, parentId)) {
      throw new ApiError('client', 'The folder can no longer move there');
    }

    const batch = writeBatch(db);
    for (const update of getMoveUpdates(folders, folderId, parentId)) {
      batch.update(doc(db, 'users', uid, 'folders', update.id), {
        parentId: update.parentId,
        depth: update.depth,
      });
    }
    await batch.commit();
  });
}

export function deleteFolder(uid: string, folderId: string): Promise<void> {
  return run(async (db) => {
    const [folders, items] = await Promise.all([readFolders(db, uid), readItems(db, uid)]);
    const deletedIds = getBranch(folders, folderId).map(({ id }) => id);

    const batch = writeBatch(db);
    for (const id of deletedIds) batch.delete(doc(db, 'users', uid, 'folders', id));
    // A transform, not the array just read: a folder added since then must survive.
    for (const { id } of getFolderIdUpdates(items, deletedIds)) {
      batch.update(doc(db, 'users', uid, 'items', id), { folderIds: arrayRemove(...deletedIds) });
    }
    await batch.commit();
  });
}
