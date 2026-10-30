import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  type Firestore,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

let env: RulesTestEnvironment;

const asUser = (uid: string): Firestore => env.authenticatedContext(uid).firestore();
const anonymous = (): Firestore => env.unauthenticatedContext().firestore();

const folder = (name: string, parentId: string | null, depth: number) => ({
  name,
  parentId,
  depth,
  createdAt: serverTimestamp(),
});

const item = (overrides: Record<string, unknown> = {}) => ({
  mediaType: 'movie',
  tmdbId: 550,
  title: 'Fight Club',
  posterPath: '/poster.jpg',
  status: 'planned',
  folderIds: [],
  addedAt: serverTimestamp(),
  ...overrides,
});

/** Creates a chain of folders `f1` → `f2` → … → `f<depth>` for the user. */
async function seedChain(uid: string, depth: number): Promise<void> {
  const db = asUser(uid);
  for (let level = 1; level <= depth; level += 1) {
    const parentId = level === 1 ? null : `f${level - 1}`;
    await setDoc(doc(db, `users/${uid}/folders/f${level}`), folder(`F${level}`, parentId, level));
  }
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-cinepulse',
    firestore: {
      rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'),
    },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
});

afterAll(async () => {
  await env.cleanup();
});

describe('access', () => {
  it('lets an owner read their own data', async () => {
    await seedChain('alice', 1);

    await assertSucceeds(getDoc(doc(asUser('alice'), 'users/alice/folders/f1')));
  });

  it("hides a user's data from another user", async () => {
    await seedChain('alice', 1);

    await assertFails(getDoc(doc(asUser('bob'), 'users/alice/folders/f1')));
    await assertFails(setDoc(doc(asUser('bob'), 'users/alice/folders/x'), folder('X', null, 1)));
    await assertFails(deleteDoc(doc(asUser('bob'), 'users/alice/folders/f1')));
  });

  it('hides everything from anonymous visitors', async () => {
    await seedChain('alice', 1);

    await assertFails(getDoc(doc(anonymous(), 'users/alice/folders/f1')));
    await assertFails(setDoc(doc(anonymous(), 'users/alice/folders/x'), folder('X', null, 1)));
  });

  it('denies paths outside the model', async () => {
    await assertFails(setDoc(doc(asUser('alice'), 'users/alice'), { name: 'Alice' }));
    await assertFails(setDoc(doc(asUser('alice'), 'users/alice/other/x'), { a: 1 }));
    await assertFails(setDoc(doc(asUser('alice'), 'public/x'), { a: 1 }));
  });
});

describe('folders', () => {
  it('accepts nesting up to six levels', async () => {
    await expect(seedChain('alice', 6)).resolves.toBeUndefined();
  });

  it('rejects a seventh level', async () => {
    await seedChain('alice', 6);

    await assertFails(
      setDoc(doc(asUser('alice'), 'users/alice/folders/f7'), folder('F7', 'f6', 7))
    );
  });

  it('rejects a depth that does not follow the parent', async () => {
    await seedChain('alice', 2);
    const db = asUser('alice');

    await assertFails(setDoc(doc(db, 'users/alice/folders/x'), folder('X', 'f2', 2)));
    await assertFails(setDoc(doc(db, 'users/alice/folders/y'), folder('Y', null, 2)));
  });

  it('rejects a missing parent', async () => {
    await assertFails(
      setDoc(doc(asUser('alice'), 'users/alice/folders/x'), folder('X', 'nope', 2))
    );
  });

  it('rejects a folder that is its own parent', async () => {
    await assertFails(setDoc(doc(asUser('alice'), 'users/alice/folders/x'), folder('X', 'x', 2)));
  });

  it('rejects an empty name and extra fields', async () => {
    const db = asUser('alice');

    await assertFails(setDoc(doc(db, 'users/alice/folders/x'), folder('', null, 1)));
    await assertFails(
      setDoc(doc(db, 'users/alice/folders/y'), { ...folder('Y', null, 1), color: 'red' })
    );
  });

  it('renames a folder', async () => {
    await seedChain('alice', 1);

    await assertSucceeds(
      updateDoc(doc(asUser('alice'), 'users/alice/folders/f1'), { name: 'New' })
    );
  });

  it('keeps createdAt unchanged', async () => {
    await seedChain('alice', 1);

    await assertFails(
      updateDoc(doc(asUser('alice'), 'users/alice/folders/f1'), { createdAt: new Date(0) })
    );
  });

  it('moves a branch in one batch', async () => {
    await seedChain('alice', 3);
    const db = asUser('alice');
    await setDoc(doc(db, 'users/alice/folders/root2'), folder('Root 2', null, 1));
    await setDoc(doc(db, 'users/alice/folders/deep'), folder('Deep', 'root2', 2));

    const batch = writeBatch(db);
    batch.update(doc(db, 'users/alice/folders/f2'), { parentId: 'deep', depth: 3 });
    batch.update(doc(db, 'users/alice/folders/f3'), { depth: 4 });

    await assertSucceeds(batch.commit());
  });

  it('rejects a move that takes a branch below six levels', async () => {
    await seedChain('alice', 6);
    const db = asUser('alice');
    await setDoc(doc(db, 'users/alice/folders/a'), folder('A', null, 1));
    await setDoc(doc(db, 'users/alice/folders/b'), folder('B', 'a', 2));

    await assertFails(updateDoc(doc(db, 'users/alice/folders/f6'), { parentId: 'b', depth: 7 }));
  });
});

describe('items', () => {
  const itemPath = 'users/alice/items/movie_550';

  it('stores a title under its media type and TMDB id', async () => {
    await assertSucceeds(setDoc(doc(asUser('alice'), itemPath), item()));
  });

  it('rejects an id that does not match the title', async () => {
    await assertFails(setDoc(doc(asUser('alice'), 'users/alice/items/movie_1'), item()));
  });

  it('accepts a TV show and a title without a poster', async () => {
    await assertSucceeds(
      setDoc(
        doc(asUser('alice'), 'users/alice/items/tv_1399'),
        item({ mediaType: 'tv', tmdbId: 1399, posterPath: null })
      )
    );
  });

  it('rejects an unknown status or media type', async () => {
    const db = asUser('alice');

    await assertFails(setDoc(doc(db, itemPath), item({ status: 'dropped' })));
    await assertFails(
      setDoc(doc(db, 'users/alice/items/person_1'), item({ mediaType: 'person', tmdbId: 1 }))
    );
  });

  it('puts a title in several folders and changes its status', async () => {
    const db = asUser('alice');
    await setDoc(doc(db, itemPath), item());

    await assertSucceeds(
      updateDoc(doc(db, itemPath), { folderIds: ['f1', 'f2'], status: 'watched' })
    );
  });

  it('keeps the identity of a title unchanged', async () => {
    const db = asUser('alice');
    await setDoc(doc(db, itemPath), item());

    await assertFails(updateDoc(doc(db, itemPath), { tmdbId: 551 }));
  });

  it('removes a title', async () => {
    const db = asUser('alice');
    await setDoc(doc(db, itemPath), item());

    await assertSucceeds(deleteDoc(doc(db, itemPath)));
  });
});
