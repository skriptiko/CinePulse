import { type AuthUser, globalStore } from '@repo/events';
import { ROUTE_PATHS } from '@repo/routes';
import { expectNoA11yViolations, renderWithProviders, screen, server } from '@repo/test-utils';
import { FirebaseError } from 'firebase/app';
import { deleteUser, onAuthStateChanged, reauthenticateWithPopup } from 'firebase/auth';
import { getDocs, writeBatch } from 'firebase/firestore/lite';
import { HttpResponse, http } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Login } from '../../pages/login';
import { Settings } from '../../pages/settings';
import { RequireAuth } from '../require-auth';

const FIREBASE_USER = { uid: 'uid-1', displayName: 'Ada', email: 'ada@example.com' };

vi.mock('firebase/app', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/app')>()),
  initializeApp: (options: object) => ({ options }),
}));
vi.mock('firebase/auth', () => ({
  connectAuthEmulator: vi.fn(),
  deleteUser: vi.fn(),
  getAuth: () => ({ authStateReady: () => Promise.resolve(), currentUser: FIREBASE_USER }),
  GoogleAuthProvider: class {},
  onAuthStateChanged: vi.fn(),
  reauthenticateWithPopup: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('firebase/firestore/lite', () => ({
  collection: (_db: unknown, ...path: string[]) => ({ path: path.join('/') }),
  getDocs: vi.fn(),
  getFirestore: () => ({}),
  writeBatch: vi.fn(),
}));

const USER: AuthUser = {
  uid: 'uid-1',
  displayName: 'Ada',
  email: 'ada@example.com',
  photoUrl: null,
  createdAt: null,
};
const batch = { commit: vi.fn(), delete: vi.fn() };

function renderSettings() {
  return renderWithProviders(
    <Routes>
      <Route
        path={ROUTE_PATHS.USER_SETTINGS}
        element={
          <RequireAuth>
            <Settings />
          </RequireAuth>
        }
      />
      <Route path={ROUTE_PATHS.AUTH_LOGIN} element={<Login />} />
    </Routes>,
    { route: ROUTE_PATHS.USER_SETTINGS }
  );
}

async function openDialog() {
  const rendered = renderSettings();
  await rendered.user.click(screen.getByRole('button', { name: 'Delete account' }));
  return rendered;
}

describe('DeleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalStore.getState().setUser(USER);
    vi.mocked(writeBatch).mockReturnValue(batch as never);
    vi.mocked(getDocs).mockImplementation((async (ref: { path: string }) => ({
      docs: ref.path.endsWith('items') ? [{ ref: { path: `${ref.path}/movie_1` } }] : [],
    })) as never);
    // As in Firebase: deleting the user ends the session before the promise settles.
    vi.mocked(deleteUser).mockImplementation(async () => {
      const listener = vi.mocked(onAuthStateChanged).mock.calls[0]?.[1] as (user: null) => void;
      listener(null);
    });
    server.use(
      http.get('*/__/firebase/init.json', () =>
        HttpResponse.json({ apiKey: 'key', projectId: 'cinepulse-test' })
      )
    );
  });

  afterEach(() => globalStore.setState({ user: null, authStatus: 'anonymous' }));

  it('says what is deleted, and focus starts on the dialog, not on the delete button', async () => {
    await openDialog();

    const dialog = screen.getByRole('dialog', { name: 'Delete your account?' });
    expect(dialog).toHaveAccessibleDescription(
      'This deletes your watchlist: every title, folder and status. It also removes your Google sign-in from CinePulse. You cannot undo this.'
    );
    expect(dialog).toHaveFocus();
  });

  it('closes on Cancel and gives focus back to the opener', async () => {
    const { user } = await openDialog();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete account' })).toHaveFocus();
    expect(reauthenticateWithPopup).not.toHaveBeenCalled();
  });

  it('signs in again, deletes the data and the account, and confirms on its own page', async () => {
    const { user } = await openDialog();

    await user.click(screen.getByRole('button', { name: 'Delete account' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Your account is deleted' })
    ).toBeInTheDocument();
    expect(document.title).toBe('Account deleted · CinePulse');
    expect(screen.getByRole('link', { name: 'Go to Home' })).toHaveAttribute('href', '/');
    expect(batch.delete).toHaveBeenCalledExactlyOnceWith({ path: 'users/uid-1/items/movie_1' });
    expect(deleteUser).toHaveBeenCalledOnce();
  });

  it('keeps everything when the Google window is closed', async () => {
    vi.mocked(reauthenticateWithPopup).mockRejectedValueOnce(
      new FirebaseError('auth/popup-closed-by-user', 'closed')
    );
    const { user } = await openDialog();

    await user.click(screen.getByRole('button', { name: 'Delete account' }));

    expect(await screen.findByRole('button', { name: 'Delete account' })).toBeEnabled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('explains a failure and puts focus back on the delete button to try again', async () => {
    vi.mocked(reauthenticateWithPopup).mockRejectedValueOnce(
      new FirebaseError('auth/user-mismatch', 'mismatch')
    );
    const { user } = await openDialog();

    await user.click(screen.getByRole('button', { name: 'Delete account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Choose the Google account you signed in with and try again.'
    );
    expect(screen.getByRole('button', { name: 'Delete account' })).toHaveFocus();
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    await openDialog();

    await expectNoA11yViolations(document.body);
  });
});
