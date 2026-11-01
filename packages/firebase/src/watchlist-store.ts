import { ApiError } from '@repo/api';
import {
  arrayRemove,
  arrayUnion,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  type Firestore,
  getDoc,
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

/** What the catalog knows about a title; the store fills in the rest of `WatchlistItem`. */
export type WatchlistTitle = Pick<WatchlistItem, 'mediaType' | 'tmdbId' | 'title' | 'posterPath'>;

/** A difference, not a list: a folder added from another tab is not this picker's to drop. */
export type FolderChanges = {
  added: string[];
  removed: string[];
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

/**
 * Creates the title, or changes only its `folderIds`: `status` and `addedAt` are never rewritten,
 * and transforms keep a folder added since this read. Two tabs can both see no title; rules refuse
 * the second create, because its `addedAt` differs, so a create can never overwrite one. A folder
 * deleted since the picker's read is refused here: no row would be left to untick its id.
 */
export function saveTitle(
  uid: string,
  { mediaType, tmdbId, title, posterPath }: WatchlistTitle,
  { added, removed }: FolderChanges
): Promise<void> {
  return run(async (db) => {
    if (added.length > 0) {
      const folders = await readFolders(db, uid);
      if (!added.every((id) => folders.some((folder) => folder.id === id))) {
        throw new ApiError('client', 'A chosen folder no longer exists');
      }
    }

    const ref = doc(db, 'users', uid, 'items', `${mediaType}_${tmdbId}`);

    if (!(await getDoc(ref)).exists()) {
      await setDoc(ref, {
        mediaType,
        tmdbId,
        title,
        posterPath,
        status: 'planned',
        folderIds: added,
        addedAt: serverTimestamp(),
      });
      return;
    }

    // Two writes, because one write cannot hold two transforms of a field.
    const batch = writeBatch(db);
    if (added.length > 0) batch.update(ref, { folderIds: arrayUnion(...added) });
    if (removed.length > 0) batch.update(ref, { folderIds: arrayRemove(...removed) });
    await batch.commit();
  });
}

/** Folders live on the title, so this also takes it out of every folder. */
export function removeTitle(uid: string, titleId: string): Promise<void> {
  return run((db) => deleteDoc(doc(db, 'users', uid, 'items', titleId)));
}

/** Only the status: a title deleted elsewhere is refused here, not brought back. */
export function setTitleStatus(uid: string, titleId: string, status: WatchStatus): Promise<void> {
  return run((db) => updateDoc(doc(db, 'users', uid, 'items', titleId), { status }));
}
