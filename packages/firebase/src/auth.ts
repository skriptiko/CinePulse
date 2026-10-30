import { type AuthUser, createTypedEmitter, globalStore } from '@repo/events';
import type { Auth, User } from 'firebase/auth';
import { getFirebaseApp } from './app';
import { getFirebaseCode, toApiError } from './errors';

/** Firebase's convention: a `demo-` project has no backend and only talks to emulators. */
const DEMO_PROJECT_PREFIX = 'demo-';
const AUTH_EMULATOR_URL = 'http://127.0.0.1:5013';

const POPUP_DISMISSED_CODES = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];

/**
 * Set while someone is signed in on this browser. Anonymous visitors never download the SDK,
 * which keeps it out of the catalog's first load.
 */
const SESSION_FLAG_KEY = 'cinepulse-signed-in';

const emitErrorReport = createTypedEmitter('error:report');
const emitLogin = createTypedEmitter('user:login');
const emitLogout = createTypedEmitter('user:logout');

type Session = {
  auth: Auth;
  sdk: typeof import('firebase/auth');
};

let session: Promise<Session> | undefined;

/** Call once before the first render, so a protected page knows whether to wait. */
export function startAuthSession(): void {
  if (!hasSessionFlag()) return;

  globalStore.setState({ authStatus: 'loading' });
  // The flag stays: a failed load says nothing about the session, the next visit retries.
  getSession().catch((error: unknown) => {
    globalStore.getState().setUser(null);
    emitErrorReport({ error, source: 'auth' });
  });
}

/**
 * Loads the SDK ahead of the click. Browsers only allow a popup right after a user gesture,
 * so `signInWithGoogle` must not spend that moment on the network.
 */
export async function prepareSignIn(): Promise<void> {
  // A failure surfaces on the click, which retries.
  await getSession().catch(() => undefined);
}

export async function signInWithGoogle(): Promise<void> {
  try {
    const { auth, sdk } = await getSession();
    await sdk.signInWithPopup(auth, new sdk.GoogleAuthProvider());
  } catch (error) {
    if (POPUP_DISMISSED_CODES.includes(getFirebaseCode(error) ?? '')) return;
    throw toApiError(error);
  }
}

export async function signOutUser(): Promise<void> {
  try {
    const { auth, sdk } = await getSession();
    await sdk.signOut(auth);
  } catch (error) {
    throw toApiError(error);
  }
}

function getSession(): Promise<Session> {
  session ??= connect().catch((error: unknown) => {
    session = undefined;
    throw error;
  });
  return session;
}

async function connect(): Promise<Session> {
  const [app, sdk] = await Promise.all([getFirebaseApp(), import('firebase/auth')]);
  const auth = sdk.getAuth(app);
  if (app.options.projectId?.startsWith(DEMO_PROJECT_PREFIX)) {
    sdk.connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true });
  }
  sdk.onAuthStateChanged(auth, handleAuthState);
  await auth.authStateReady();
  return { auth, sdk };
}

function handleAuthState(firebaseUser: User | null): void {
  const previous = globalStore.getState().user;
  const user = firebaseUser && toAuthUser(firebaseUser);

  storeSessionFlag(user !== null);
  globalStore.getState().setUser(user);

  if (user && user.uid !== previous?.uid) emitLogin({ user });
  if (!user && previous) emitLogout({ uid: previous.uid });
}

function toAuthUser({ uid, displayName, email, photoURL }: User): AuthUser {
  return { uid, displayName, email, photoUrl: photoURL };
}

// Storage throws when the browser blocks it: the session then lasts until the page closes.
function hasSessionFlag(): boolean {
  try {
    return window.localStorage.getItem(SESSION_FLAG_KEY) !== null;
  } catch {
    return false;
  }
}

function storeSessionFlag(isSignedIn: boolean): void {
  try {
    if (isSignedIn) window.localStorage.setItem(SESSION_FLAG_KEY, '1');
    else window.localStorage.removeItem(SESSION_FLAG_KEY);
  } catch {
    // See `hasSessionFlag`.
  }
}
