import { type AuthUser, globalStore } from '@repo/events';
import { ROUTE_PATHS } from '@repo/routes';
import {
  expectNoA11yViolations,
  render,
  renderWithProviders,
  screen,
  server,
  waitFor,
} from '@repo/test-utils';
import { FirebaseError } from 'firebase/app';
import { signInWithPopup } from 'firebase/auth';
import { HttpResponse, http } from 'msw';
import { act } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Login } from '../login';

vi.mock('firebase/app', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/app')>()),
  initializeApp: (options: object) => ({ options }),
}));
vi.mock('firebase/auth', () => ({
  connectAuthEmulator: vi.fn(),
  getAuth: () => ({ authStateReady: () => Promise.resolve() }),
  GoogleAuthProvider: class {},
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

const USER: AuthUser = { uid: 'uid-1', displayName: 'Ada', email: null, photoUrl: null };

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.use(
      http.get('*/__/firebase/init.json', () =>
        HttpResponse.json({ apiKey: 'key', projectId: 'cinepulse-test' })
      )
    );
  });

  afterEach(() => globalStore.setState({ user: null, authStatus: 'anonymous' }));

  it('signs in with Google', async () => {
    const { user } = renderWithProviders(<Login />);

    await user.click(screen.getByRole('button', { name: 'Continue with Google' }));

    await waitFor(() => expect(signInWithPopup).toHaveBeenCalledOnce());
  });

  it('shows why sign-in failed', async () => {
    vi.mocked(signInWithPopup).mockRejectedValueOnce(
      new FirebaseError('auth/popup-blocked', 'blocked')
    );
    const { user } = renderWithProviders(<Login />);

    await user.click(screen.getByRole('button', { name: 'Continue with Google' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Allow pop-ups for this site and try again.'
    );
  });

  it('returns to the page that required the login', () => {
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: ROUTE_PATHS.AUTH_LOGIN, state: { from: ROUTE_PATHS.USER_SETTINGS } },
        ]}
      >
        <Routes>
          <Route path={ROUTE_PATHS.AUTH_LOGIN} element={<Login />} />
          <Route path={ROUTE_PATHS.USER_SETTINGS} element={<p>settings</p>} />
        </Routes>
      </MemoryRouter>
    );

    act(() => globalStore.getState().setUser(USER));

    expect(screen.getByText('settings')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<Login />);

    await expectNoA11yViolations(container);
  });
});
