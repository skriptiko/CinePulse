import { createTypedListener, globalStore } from '@repo/events';
import { server, waitFor } from '@repo/test-utils';
import { FirebaseError } from 'firebase/app';
import {
  connectAuthEmulator,
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { getDocs, writeBatch } from 'firebase/firestore/lite';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSignInErrorMessage } from '../errors';

vi.mock('firebase/app', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/app')>()),
  initializeApp: (options: { projectId: string }) => ({ options }),
}));
const auth = vi.hoisted(() => ({
  authStateReady: () => Promise.resolve(),
  currentUser: null as object | null,
}));
vi.mock('firebase/auth', () => ({
  connectAuthEmulator: vi.fn(),
  deleteUser: vi.fn(),
  getAuth: () => auth,
  GoogleAuthProvider: class {},
  onAuthStateChanged: vi.fn(),
  reauthenticateWithPopup: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('firebase/firestore/lite', () => ({
  collection: (_db: unknown, ...path: string[]) => ({ path: path.join('/') }),
  getDocs: vi.fn(),
  getFirestore: () => ({}),
  writeBatch: vi.fn(),
}));

const FIREBASE_USER = {
  uid: 'uid-1',
  displayName: 'Ada',
  email: 'ada@example.com',
  photoURL: 'https://example.com/ada.png',
  metadata: { creationTime: 'Sat, 31 Oct 2026 08:00:00 GMT' },
};
const SESSION_KEY = 'cinepulse-signed-in';

type StateListener = (user: typeof FIREBASE_USER | null) => void;

/** Fresh module state per test: the package memoizes the app and the session. */
async function loadAuth() {
  vi.resetModules();
  return import('../auth');
}

function mockConfig(projectId = 'cinepulse-test') {
  server.use(
    http.get('*/__/firebase/init.json', () => HttpResponse.json({ apiKey: 'key', projectId }))
  );
}

/** The listener the module passed to `onAuthStateChanged`. */
async function getStateListener(): Promise<StateListener> {
  await waitFor(() => expect(onAuthStateChanged).toHaveBeenCalled());
  return vi.mocked(onAuthStateChanged).mock.calls[0]?.[1] as unknown as StateListener;
}

describe('auth session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    globalStore.setState({ user: null, authStatus: 'anonymous' });
    mockConfig();
  });

  it('stays anonymous without loading Firebase when nobody signed in on this browser', async () => {
    const { startAuthSession } = await loadAuth();

    startAuthSession();

    expect(globalStore.getState().authStatus).toBe('anonymous');
    expect(onAuthStateChanged).not.toHaveBeenCalled();
  });

  it('restores a session and announces the user', async () => {
    localStorage.setItem(SESSION_KEY, '1');
    const onLogin = vi.fn();
    const unsubscribe = createTypedListener('user:login')(onLogin);
    const { startAuthSession } = await loadAuth();

    startAuthSession();
    expect(globalStore.getState().authStatus).toBe('loading');
    (await getStateListener())(FIREBASE_USER);

    const user = {
      uid: 'uid-1',
      displayName: 'Ada',
      email: 'ada@example.com',
      photoUrl: 'https://example.com/ada.png',
      createdAt: 'Sat, 31 Oct 2026 08:00:00 GMT',
    };
    expect(globalStore.getState()).toMatchObject({ user, authStatus: 'authenticated' });
    expect(onLogin).toHaveBeenCalledExactlyOnceWith({ user });
    unsubscribe();
  });

  it('forgets the session and announces the logout', async () => {
    localStorage.setItem(SESSION_KEY, '1');
    const onLogout = vi.fn();
    const unsubscribe = createTypedListener('user:logout')(onLogout);
    const { startAuthSession } = await loadAuth();
    startAuthSession();
    const listener = await getStateListener();
    listener(FIREBASE_USER);

    listener(null);

    expect(globalStore.getState()).toMatchObject({ user: null, authStatus: 'anonymous' });
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(onLogout).toHaveBeenCalledExactlyOnceWith({ uid: 'uid-1' });
    unsubscribe();
  });

  it('falls back to anonymous and keeps the flag when Firebase cannot load', async () => {
    localStorage.setItem(SESSION_KEY, '1');
    server.use(http.get('*/__/firebase/init.json', () => new HttpResponse(null, { status: 503 })));
    const onReport = vi.fn();
    const unsubscribe = createTypedListener('error:report')(onReport);
    const { startAuthSession } = await loadAuth();

    startAuthSession();

    await waitFor(() => expect(globalStore.getState().authStatus).toBe('anonymous'));
    expect(localStorage.getItem(SESSION_KEY)).toBe('1');
    expect(onReport).toHaveBeenCalledWith(expect.objectContaining({ source: 'auth' }));
    unsubscribe();
  });

  it('uses the Auth emulator on demo projects only', async () => {
    mockConfig('demo-cinepulse');
    const { prepareSignIn } = await loadAuth();

    await prepareSignIn();

    expect(connectAuthEmulator).toHaveBeenCalledOnce();
  });

  it('does not use the Auth emulator on a real project', async () => {
    const { prepareSignIn } = await loadAuth();

    await prepareSignIn();

    expect(connectAuthEmulator).not.toHaveBeenCalled();
  });
});

describe('signInWithGoogle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockConfig();
  });

  it('opens the popup and returns the user who signed in', async () => {
    vi.mocked(signInWithPopup).mockResolvedValueOnce({ user: FIREBASE_USER } as never);
    const { signInWithGoogle } = await loadAuth();

    await expect(signInWithGoogle()).resolves.toEqual({
      uid: 'uid-1',
      displayName: 'Ada',
      email: 'ada@example.com',
      photoUrl: 'https://example.com/ada.png',
      createdAt: 'Sat, 31 Oct 2026 08:00:00 GMT',
    });
    expect(signInWithPopup).toHaveBeenCalledOnce();
  });

  it('treats a closed popup as a change of mind, not a failure', async () => {
    vi.mocked(signInWithPopup).mockRejectedValueOnce(
      new FirebaseError('auth/popup-closed-by-user', 'closed')
    );
    const { signInWithGoogle } = await loadAuth();

    await expect(signInWithGoogle()).resolves.toBeNull();
  });

  it('turns a network failure into a network ApiError', async () => {
    vi.mocked(signInWithPopup).mockRejectedValueOnce(
      new FirebaseError('auth/network-request-failed', 'offline')
    );
    const { signInWithGoogle } = await loadAuth();

    await expect(signInWithGoogle()).rejects.toMatchObject({ name: 'ApiError', kind: 'network' });
  });

  it('explains a blocked popup', async () => {
    vi.mocked(signInWithPopup).mockRejectedValueOnce(
      new FirebaseError('auth/popup-blocked', 'blocked')
    );
    const { signInWithGoogle } = await loadAuth();

    const error = await signInWithGoogle().catch((caught: unknown) => caught);

    expect(getSignInErrorMessage(error)).toBe('Allow pop-ups for this site and try again.');
  });
});

describe('signOutUser', () => {
  it('signs out of Firebase', async () => {
    mockConfig();
    const { signOutUser } = await loadAuth();

    await signOutUser();

    expect(signOut).toHaveBeenCalledOnce();
  });
});

describe('deleteAccount', () => {
  const batch = { commit: vi.fn(), delete: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig();
    auth.currentUser = FIREBASE_USER;
    vi.mocked(writeBatch).mockReturnValue(batch as never);
    vi.mocked(getDocs).mockImplementation((async (ref: { path: string }) => ({
      docs: [{ ref: { path: `${ref.path}/1` } }],
    })) as never);
  });

  it('signs in again, then deletes the data and the account in that order', async () => {
    const { deleteAccount } = await loadAuth();

    await expect(deleteAccount()).resolves.toBe(true);

    expect(reauthenticateWithPopup).toHaveBeenCalledWith(FIREBASE_USER, expect.anything());
    expect(batch.delete.mock.calls.map(([ref]) => ref.path).sort()).toEqual([
      'users/uid-1/folders/1',
      'users/uid-1/items/1',
    ]);
    expect(deleteUser).toHaveBeenCalledWith(FIREBASE_USER);
    const order = [reauthenticateWithPopup, batch.commit, deleteUser].map(
      (mock) => vi.mocked(mock).mock.invocationCallOrder[0]
    );
    expect(order).toEqual([...order].sort((a = 0, b = 0) => a - b));
  });

  it('deletes nothing when the popup is closed', async () => {
    vi.mocked(reauthenticateWithPopup).mockRejectedValueOnce(
      new FirebaseError('auth/popup-closed-by-user', 'closed')
    );
    const { deleteAccount } = await loadAuth();

    await expect(deleteAccount()).resolves.toBe(false);

    expect(batch.commit).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('keeps the account when the data cannot be deleted', async () => {
    batch.commit.mockRejectedValueOnce(
      Object.assign(new Error('offline'), { code: 'unavailable' })
    );
    const { deleteAccount } = await loadAuth();

    await expect(deleteAccount()).rejects.toMatchObject({ name: 'ApiError', kind: 'network' });

    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('explains a re-sign-in with a different Google account', async () => {
    vi.mocked(reauthenticateWithPopup).mockRejectedValueOnce(
      new FirebaseError('auth/user-mismatch', 'mismatch')
    );
    const { deleteAccount } = await loadAuth();

    const error = await deleteAccount().catch((caught: unknown) => caught);

    expect(getSignInErrorMessage(error)).toBe(
      'Choose the Google account you signed in with and try again.'
    );
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('fails without a signed-in user', async () => {
    auth.currentUser = null;
    const { deleteAccount } = await loadAuth();

    const error = await deleteAccount().catch((caught: unknown) => caught);

    expect(error).toMatchObject({ name: 'ApiError', kind: 'client' });
    expect(getSignInErrorMessage(error)).toBe('You are signed out. Sign in and try again.');
    expect(reauthenticateWithPopup).not.toHaveBeenCalled();
  });
});
