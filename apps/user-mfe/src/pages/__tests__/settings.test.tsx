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
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Settings } from '../settings';

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
  createdAt: null,
};

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalStore.getState().setUser(USER);
    globalStore.getState().setTheme('dark');
    server.use(
      http.get('*/__/firebase/init.json', () =>
        HttpResponse.json({ apiKey: 'key', projectId: 'cinepulse-test' })
      )
    );
  });

  afterEach(() => {
    globalStore.getState().setUser(null);
    globalStore.getState().setTheme('dark');
  });

  it('has a page title and heading', () => {
    renderWithProviders(<Settings />);

    expect(screen.getByRole('heading', { level: 1, name: 'User Settings' })).toBeInTheDocument();
    expect(document.title).toBe('Settings · CinePulse');
  });

  it('marks the current theme', () => {
    globalStore.getState().setTheme('system');
    renderWithProviders(<Settings />);

    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Dark' })).not.toBeChecked();
  });

  it('applies and stores a new theme at once', async () => {
    const { user } = renderWithProviders(<Settings />);

    await user.click(screen.getByRole('radio', { name: 'Light' }));

    expect(globalStore.getState().theme).toBe('light');
    expect(window.localStorage.getItem('cinepulse-theme')).toBe('light');
    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
  });

  it('keeps the theme for a press on the chosen one', async () => {
    const { user } = renderWithProviders(<Settings />);

    await user.click(screen.getByRole('radio', { name: 'Dark' }));

    expect(globalStore.getState().theme).toBe('dark');
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
  });

  it('follows a theme changed elsewhere, such as in the header', () => {
    renderWithProviders(<Settings />);

    act(() => globalStore.getState().setTheme('light'));

    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
  });

  it('says who is signed in, and signs out', async () => {
    const { user } = renderWithProviders(<Settings />);

    expect(screen.getByText('Signed in as ada@example.com')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(signOut).toHaveBeenCalledOnce());
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<Settings />);

    await expectNoA11yViolations(container);
  });
});
