import { type AuthUser, globalStore } from '@repo/events';
import {
  expectNoA11yViolations,
  renderWithProviders,
  screen,
  server,
  waitFor,
} from '@repo/test-utils';
import { signOut } from 'firebase/auth';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Profile } from '../profile';

vi.mock('firebase/app', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/app')>()),
  initializeApp: (options: object) => ({ options }),
}));
vi.mock('firebase/auth', () => ({
  connectAuthEmulator: vi.fn(),
  getAuth: () => ({ authStateReady: () => Promise.resolve() }),
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
}));

const USER: AuthUser = {
  uid: 'uid-1',
  displayName: 'Ada',
  email: 'ada@example.com',
  photoUrl: null,
};

describe('Profile', () => {
  beforeEach(() => {
    globalStore.getState().setUser(USER);
    server.use(
      http.get('*/__/firebase/init.json', () =>
        HttpResponse.json({ apiKey: 'key', projectId: 'cinepulse-test' })
      )
    );
  });
  afterEach(() => globalStore.getState().setUser(null));

  it('greets the user by name', () => {
    renderWithProviders(<Profile />);

    expect(screen.getByText('Welcome, Ada!')).toBeInTheDocument();
  });

  it('falls back to the email without a display name', () => {
    globalStore.getState().setUser({ ...USER, displayName: null });
    renderWithProviders(<Profile />);

    expect(screen.getByText('Welcome, ada@example.com!')).toBeInTheDocument();
  });

  it('signs out', async () => {
    const { user } = renderWithProviders(<Profile />);

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(signOut).toHaveBeenCalledOnce());
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<Profile />);

    await expectNoA11yViolations(container);
  });
});
