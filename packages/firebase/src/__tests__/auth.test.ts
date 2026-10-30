import { createTypedListener, globalStore } from '@repo/events';
import { server, waitFor } from '@repo/test-utils';
import { FirebaseError } from 'firebase/app';
import { connectAuthEmulator, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSignInErrorMessage } from '../errors';

vi.mock('firebase/app', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/app')>()),
  initializeApp: (options: { projectId: string }) => ({ options }),
}));
vi.mock('firebase/auth', () => ({
  connectAuthEmulator: vi.fn(),
  getAuth: () => ({ authStateReady: () => Promise.resolve() }),
  GoogleAuthProvider: class {},
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

const FIREBASE_USER = {
  uid: 'uid-1',
  displayName: 'Ada',
  email: 'ada@example.com',
  photoURL: 'https://example.com/ada.png',
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

  it('opens the popup', async () => {
    const { signInWithGoogle } = await loadAuth();

    await signInWithGoogle();

    expect(signInWithPopup).toHaveBeenCalledOnce();
  });

  it('treats a closed popup as a change of mind, not a failure', async () => {
    vi.mocked(signInWithPopup).mockRejectedValueOnce(
      new FirebaseError('auth/popup-closed-by-user', 'closed')
    );
    const { signInWithGoogle } = await loadAuth();

    await expect(signInWithGoogle()).resolves.toBeUndefined();
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
