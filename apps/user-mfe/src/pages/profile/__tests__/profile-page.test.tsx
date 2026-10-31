import { type AuthUser, globalStore } from '@repo/events';
import {
  expectNoA11yViolations,
  renderWithProviders,
  screen,
  server,
  waitFor,
  within,
} from '@repo/test-utils';
import { signOut } from 'firebase/auth';
import { getDocs } from 'firebase/firestore/lite';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfilePage } from '../profile-page';

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
vi.mock('firebase/firestore/lite', () => ({
  collection: (_db: unknown, ...path: string[]) => ({ path: path.join('/') }),
  connectFirestoreEmulator: vi.fn(),
  getDocs: vi.fn(),
  getFirestore: () => ({}),
  orderBy: vi.fn(),
  query: (ref: unknown) => ref,
}));

const USER: AuthUser = {
  uid: 'uid-1',
  displayName: 'Ada',
  email: 'ada@example.com',
  photoUrl: null,
  createdAt: 'Sat, 31 Oct 2026 08:00:00 GMT',
};

const FOLDER = { id: 'top', name: 'Top', parentId: null, depth: 1 };
const PLANNED = { id: 'movie_1', status: 'planned', folderIds: [] };
const WATCHED = { id: 'movie_2', status: 'watched', folderIds: [] };

function mockWatchlist(folders: { id: string }[], items: { id: string }[]) {
  const toSnapshot = (rows: { id: string }[]) => ({
    docs: rows.map(({ id, ...data }) => ({ id, data: () => data })),
  });
  vi.mocked(getDocs).mockImplementation((async (ref: { path: string }) =>
    toSnapshot(ref.path.endsWith('folders') ? folders : items)) as never);
}

function stat(label: string) {
  return screen.getByText(label).nextElementSibling?.textContent;
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalStore.getState().setUser(USER);
    mockWatchlist([FOLDER], [PLANNED, PLANNED, WATCHED]);
    server.use(
      http.get('*/__/firebase/init.json', () =>
        HttpResponse.json({ apiKey: 'key', projectId: 'cinepulse-test' })
      )
    );
  });
  afterEach(() => globalStore.getState().setUser(null));

  it('shows the name, the email and when the account was created', () => {
    renderWithProviders(<ProfilePage />);

    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(screen.getByText('Member since Oct 31, 2026')).toBeInTheDocument();
  });

  it('shows the email once without a display name', () => {
    globalStore.getState().setUser({ ...USER, displayName: null });
    renderWithProviders(<ProfilePage />);

    expect(screen.getAllByText('ada@example.com')).toHaveLength(1);
  });

  it('leaves out a date Firebase did not give', () => {
    globalStore.getState().setUser({ ...USER, createdAt: null });
    renderWithProviders(<ProfilePage />);

    expect(screen.queryByText(/Member since/)).not.toBeInTheDocument();
  });

  it('shows the photo without a referrer, as Google requires', () => {
    globalStore.getState().setUser({ ...USER, photoUrl: 'https://example.com/ada.png' });
    const { container } = renderWithProviders(<ProfilePage />);

    const photo = container.querySelector('img');
    expect(photo).toHaveAttribute('src', 'https://example.com/ada.png');
    expect(photo).toHaveAttribute('referrerpolicy', 'no-referrer');
  });

  it('counts the titles by status and the folders', async () => {
    renderWithProviders(<ProfilePage />);

    await screen.findByText('Titles');
    expect(stat('Titles')).toBe('3');
    expect(stat('Planned')).toBe('2');
    expect(stat('Watched')).toBe('1');
    expect(stat('Folders')).toBe('1');
  });

  it('shows the account while the stats load', () => {
    vi.mocked(getDocs).mockImplementation((() => new Promise(() => {})) as never);
    renderWithProviders(<ProfilePage />);

    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open watchlist' })).toBeInTheDocument();
  });

  it('keeps the account when the stats fail, and offers a retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(getDocs).mockRejectedValue(
      Object.assign(new Error('offline'), { code: 'unavailable' })
    );
    const { user } = renderWithProviders(<ProfilePage />);

    const alert = await screen.findByRole('alert');
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open watchlist' })).toBeInTheDocument();

    mockWatchlist([FOLDER], [PLANNED]);
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));

    await screen.findByText('Titles');
    expect(stat('Titles')).toBe('1');
    vi.restoreAllMocks();
  });

  it('leads an empty watchlist to the catalog', async () => {
    mockWatchlist([], []);
    renderWithProviders(<ProfilePage />);

    expect(await screen.findByText('No titles yet.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse movies' })).toHaveAttribute('href', '/movies');
    expect(screen.queryByText('Titles')).not.toBeInTheDocument();
  });

  it('links to the watchlist and the settings', () => {
    renderWithProviders(<ProfilePage />);

    expect(screen.getByRole('link', { name: 'Open watchlist' })).toHaveAttribute(
      'href',
      '/user/watchlist'
    );
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/user/settings'
    );
  });

  it('signs out', async () => {
    const { user } = renderWithProviders(<ProfilePage />);

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(signOut).toHaveBeenCalledOnce());
  });

  it('renders nothing in the render in which sign-out lands', () => {
    globalStore.getState().setUser(null);
    const { container } = renderWithProviders(<ProfilePage />);

    expect(container).toBeEmptyDOMElement();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<ProfilePage />);

    await screen.findByText('Titles');
    await expectNoA11yViolations(container);
  });
});
