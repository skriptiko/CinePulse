import { createTypedListener, globalStore, type NotificationPayload } from '@repo/events';
import {
  buildMovie,
  buildTvDetails,
  expectNoA11yViolations,
  renderWithProviders,
  screen,
  server,
  waitFor,
  within,
} from '@repo/test-utils';
import { toMovieCardData } from '@repo/ui';
import { onlineManager } from '@tanstack/react-query';
import { FirebaseError } from 'firebase/app';
import { signInWithPopup } from 'firebase/auth';
import { getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore/lite';
import { HttpResponse, http } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MovieDetail } from '../../pages/movie-detail/movie-detail-page';
import { TVDetail } from '../../pages/tv-detail/tv-detail-page';
import { AddToWatchlist, renderAddToWatchlist } from '../add-to-watchlist';

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
}));
vi.mock('firebase/firestore/lite', () => ({
  arrayRemove: (...ids: string[]) => ({ arrayRemove: ids }),
  arrayUnion: (...ids: string[]) => ({ arrayUnion: ids }),
  collection: (_db: unknown, ...path: string[]) => ({ path: path.join('/') }),
  connectFirestoreEmulator: vi.fn(),
  doc: (_first: unknown, ...path: string[]) => ({ path: path.join('/') }),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  getFirestore: () => ({}),
  orderBy: vi.fn(),
  query: (ref: unknown) => ref,
  serverTimestamp: () => 'now',
  setDoc: vi.fn(),
  writeBatch: vi.fn(),
}));

const TITLE = { mediaType: 'movie', tmdbId: 1, title: 'Dune', posterPath: null } as const;
const FOLDERS = [
  { id: 'top', name: 'Top', parentId: null, depth: 1 },
  { id: 'child', name: 'Child', parentId: 'top', depth: 2 },
];
const STORED = { id: 'movie_1', ...TITLE, status: 'watched', folderIds: ['top', 'elsewhere'] };
const ACCOUNT = { uid: 'u', displayName: null, email: null, photoUrl: null, createdAt: null };
const FIREBASE_USER = { uid: 'u', displayName: null, email: null, photoURL: null, metadata: {} };

const batch = { commit: vi.fn(), update: vi.fn() };

function toSnapshot(rows: { id: string }[]) {
  return { docs: rows.map(({ id, ...data }) => ({ id, data: () => data })) };
}

function mockReads(folders: typeof FOLDERS, items: (typeof STORED)[]) {
  vi.mocked(getDocs).mockImplementation((async (ref: { path: string }) =>
    toSnapshot(ref.path.endsWith('folders') ? folders : items)) as never);
  vi.mocked(getDoc).mockResolvedValue({ exists: () => items.length > 0 } as never);
}

function renderButton(showLabel = false) {
  return renderWithProviders(<AddToWatchlist title={TITLE} showLabel={showLabel} />, {
    route: '/movies?genre=28',
  });
}

/** The popup signs in; the store hears of it first, as from `onAuthStateChanged`. */
function mockSignIn() {
  vi.mocked(signInWithPopup).mockImplementation(async () => {
    globalStore.getState().setUser(ACCOUNT);
    return { user: FIREBASE_USER } as never;
  });
}

function listenToToasts() {
  const shown: NotificationPayload[] = [];
  const stopListening = createTypedListener('notification:show')((payload) => {
    shown.push(payload);
  });
  return { shown, stopListening };
}

/** Enabled once the SDK has loaded, so the popup can open on the press. */
async function signInButton() {
  const button = await screen.findByRole('button', { name: 'Continue with Google' });
  await waitFor(() => expect(button).toBeEnabled());
  return button;
}

const trigger = () => screen.getByRole('button', { name: 'Add Dune to your watchlist' });

describe('AddToWatchlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalStore.getState().setUser(ACCOUNT);
    server.use(
      http.get('*/__/firebase/init.json', () =>
        HttpResponse.json({ apiKey: 'key', projectId: 'cinepulse-test' })
      )
    );
    vi.mocked(writeBatch).mockReturnValue(batch as never);
    vi.mocked(setDoc).mockResolvedValue(undefined);
    batch.commit.mockResolvedValue(undefined);
    mockReads(FOLDERS, []);
  });

  afterEach(() => {
    onlineManager.setOnline(true);
    globalStore.getState().setUser(null);
  });

  it('reads nothing while closed', () => {
    renderButton();

    expect(trigger()).toBeEnabled();
    expect(getDocs).not.toHaveBeenCalled();
    expect(getDoc).not.toHaveBeenCalled();
  });

  it('labels the button on a page with room for it', () => {
    renderButton(true);

    expect(screen.getByRole('button', { name: 'Add to watchlist' })).toHaveAttribute(
      'aria-haspopup',
      'dialog'
    );
  });

  it('offers a signed-out visitor a sign-in in place, and reads nothing', async () => {
    globalStore.getState().setUser(null);
    const { user } = renderButton();

    await user.click(trigger());

    expect(await signInButton()).toBeEnabled();
    expect(screen.getByRole('dialog', { name: 'Sign in to save Dune' })).toBeInTheDocument();
    await expectNoA11yViolations(screen.getByRole('dialog'));
    expect(getDocs).not.toHaveBeenCalled();
    expect(signInWithPopup).not.toHaveBeenCalled();
  });

  it('saves the title once the guest signs in, with no second press', async () => {
    globalStore.getState().setUser(null);
    mockSignIn();
    const { shown, stopListening } = listenToToasts();
    const { user } = renderButton();

    await user.click(trigger());
    await user.click(await signInButton());

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(signInWithPopup).toHaveBeenCalledOnce();
    expect(setDoc).toHaveBeenCalledOnce();
    expect(vi.mocked(setDoc).mock.calls[0]).toEqual([
      { path: 'users/u/items/movie_1' },
      expect.objectContaining({ tmdbId: 1, title: 'Dune', status: 'planned', folderIds: [] }),
    ]);
    expect(shown).toEqual([
      { type: 'success', message: 'Dune is in your watchlist, under All titles' },
    ]);
    await waitFor(() => expect(trigger()).toHaveFocus());
    stopListening();
  });

  it('keeps an account’s own folders when the title was already saved', async () => {
    globalStore.getState().setUser(null);
    mockSignIn();
    mockReads(FOLDERS, [STORED]);
    const { shown, stopListening } = listenToToasts();
    const { user } = renderButton();

    await user.click(trigger());
    await user.click(await signInButton());

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(setDoc).not.toHaveBeenCalled();
    expect(batch.commit).not.toHaveBeenCalled();
    expect(shown).toEqual([{ type: 'success', message: 'Dune was already in your watchlist' }]);
    stopListening();
  });

  it('leaves the next dialog open when an earlier popup ends', async () => {
    globalStore.getState().setUser(null);
    let endPopup = () => {};
    vi.mocked(signInWithPopup).mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        endPopup = () => reject(new FirebaseError('auth/cancelled-popup-request', 'cancelled'));
      })
    );
    const { user } = renderButton();

    await user.click(trigger());
    await user.click(await signInButton());
    await waitFor(() => expect(signInWithPopup).toHaveBeenCalledOnce());
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(trigger());
    await signInButton();
    endPopup();

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByRole('dialog', { name: 'Sign in to save Dune' })).toBeInTheDocument();
  });

  it('saves nothing when the guest closes the popup, and returns focus', async () => {
    globalStore.getState().setUser(null);
    vi.mocked(signInWithPopup).mockRejectedValueOnce(
      new FirebaseError('auth/popup-closed-by-user', 'closed')
    );
    const { user } = renderButton();

    await user.click(trigger());
    await user.click(await signInButton());

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger()).toHaveFocus());
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('says why sign-in failed and keeps the press for Try again', async () => {
    globalStore.getState().setUser(null);
    vi.mocked(signInWithPopup).mockRejectedValueOnce(
      new FirebaseError('auth/popup-blocked', 'blocked')
    );
    const { user } = renderButton();

    await user.click(trigger());
    await user.click(await signInButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Allow pop-ups for this site and try again.'
    );
    await waitFor(() => expect(screen.getByRole('button', { name: 'Try again' })).toHaveFocus());
    expect(setDoc).not.toHaveBeenCalled();

    mockSignIn();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() => expect(setDoc).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('opens the popup once for two clicks in one tick', async () => {
    globalStore.getState().setUser(null);
    mockSignIn();
    const { user } = renderButton();

    await user.click(trigger());
    const button = await signInButton();
    button.click();
    button.click();

    await waitFor(() => expect(setDoc).toHaveBeenCalledOnce());
    expect(signInWithPopup).toHaveBeenCalledOnce();
  });

  it('turns into the picker when the save after sign-in fails', async () => {
    globalStore.getState().setUser(null);
    mockSignIn();
    vi.mocked(setDoc).mockRejectedValueOnce(
      Object.assign(new Error('failed'), { code: 'unavailable' })
    );
    const { shown, stopListening } = listenToToasts();
    const { user } = renderButton();

    await user.click(trigger());
    await user.click(await signInButton());

    expect(await screen.findByRole('dialog', { name: 'Choose folders for Dune' })).toBeVisible();
    expect(await screen.findByRole('checkbox', { name: 'Top, level 1' })).toBeInTheDocument();
    expect(shown).toEqual([
      { type: 'error', message: 'Dune was not saved. Press Add to watchlist to try again.' },
    ]);
    stopListening();
  });

  it('lets a signed-out visitor decline', async () => {
    globalStore.getState().setUser(null);
    const { user } = renderButton();

    await user.click(trigger());
    await user.click(await screen.findByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger()).toHaveFocus());
  });

  it('keeps the press while a known session is restored', async () => {
    globalStore.setState({ user: null, authStatus: 'loading' });
    const { user } = renderButton();

    await user.click(trigger());
    expect(await screen.findByText('Loading your folders')).toBeInTheDocument();

    globalStore.getState().setUser(ACCOUNT);
    expect(await screen.findByRole('checkbox', { name: 'Top, level 1' })).toBeInTheDocument();
  });

  it('turns into the offer when the session cannot be restored', async () => {
    globalStore.setState({ user: null, authStatus: 'loading' });
    const { user } = renderButton();

    await user.click(trigger());
    await screen.findByText('Loading your folders');
    globalStore.getState().setUser(null);

    expect(await signInButton()).toBeInTheDocument();
  });

  it('shows the tree with the folders of a stored title ticked', async () => {
    mockReads(FOLDERS, [STORED]);
    const { user } = renderButton();

    await user.click(trigger());

    expect(await screen.findByRole('checkbox', { name: 'Top, level 1' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Child, level 2' })).not.toBeChecked();
    // The theme cannot set the border of a native box; `muted-foreground` has 3:1 and more.
    expect(screen.getByRole('checkbox', { name: 'Child, level 2' })).toHaveClass(
      'appearance-none',
      'border-muted-foreground'
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await expectNoA11yViolations(screen.getByRole('dialog'));
  });

  it('says that a stored title is already there', async () => {
    mockReads(FOLDERS, [STORED]);
    const { user } = renderButton();

    await user.click(trigger());

    expect(await screen.findByText('Dune is already in your watchlist.')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Choose folders for Dune' })).toBeInTheDocument();
  });

  it('offers no save for a stored title when there are no folders', async () => {
    mockReads([], [{ ...STORED, folderIds: [] }]);
    const { user } = renderButton();

    await user.click(trigger());

    expect(await screen.findByText('Dune is already in your watchlist.')).toBeInTheDocument();
    expect(screen.getByText(/No folders yet/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open watchlist' })).toBeInTheDocument();
  });

  it('does not take a show with the same TMDB id for this movie', async () => {
    mockReads(FOLDERS, [{ ...STORED, id: 'tv_1', mediaType: 'tv' }] as never);
    const { user } = renderButton();

    await user.click(trigger());

    expect(await screen.findByRole('checkbox', { name: 'Top, level 1' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Add to watchlist' })).toBeEnabled();
    expect(screen.queryByText(/already in your watchlist/)).not.toBeInTheDocument();
  });

  it('stores a card under the TMDB path of its poster', async () => {
    const card = toMovieCardData(buildMovie({ id: 7, title: 'Dune', poster_path: '/p.jpg' }));
    const { user } = renderWithProviders(renderAddToWatchlist(card));

    await user.click(trigger());
    await screen.findByRole('checkbox', { name: 'Top, level 1' });
    await user.click(screen.getByRole('button', { name: 'Add to watchlist' }));

    await waitFor(() => expect(setDoc).toHaveBeenCalledOnce());
    const [ref, data] = vi.mocked(setDoc).mock.calls[0] as unknown as [{ path: string }, object];
    expect(ref.path).toBe('users/u/items/movie_7');
    expect(data).toMatchObject({ mediaType: 'movie', tmdbId: 7, posterPath: '/p.jpg' });
  });

  it('stores the movie of a details page under its own identity', async () => {
    server.use(
      http.get('*/api/tmdb/movie/:id', () =>
        HttpResponse.json({
          ...buildMovie({ id: 7, title: 'Dune', poster_path: '/p.jpg', backdrop_path: '/b.jpg' }),
          genres: [],
          runtime: 100,
          tagline: null,
        })
      )
    );
    const { user } = renderWithProviders(
      <Routes>
        <Route path="/movies/:id" element={<MovieDetail />} />
      </Routes>,
      { route: '/movies/7' }
    );

    await user.click(await screen.findByRole('button', { name: 'Add to watchlist' }));
    await screen.findByRole('checkbox', { name: 'Top, level 1' });
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Add to watchlist' })
    );

    await waitFor(() => expect(setDoc).toHaveBeenCalledOnce());
    const [ref, data] = vi.mocked(setDoc).mock.calls[0] as unknown as [{ path: string }, object];
    expect(ref.path).toBe('users/u/items/movie_7');
    expect(data).toMatchObject({ mediaType: 'movie', tmdbId: 7, posterPath: '/p.jpg' });
  });

  it('stores the show of a details page as a show', async () => {
    server.use(
      http.get('*/api/tmdb/tv/:id', () =>
        HttpResponse.json(buildTvDetails({ id: 7, name: 'Severance', poster_path: '/p.jpg' }))
      )
    );
    const { user } = renderWithProviders(
      <Routes>
        <Route path="/tv/:id" element={<TVDetail />} />
      </Routes>,
      { route: '/tv/7' }
    );

    await user.click(await screen.findByRole('button', { name: 'Add to watchlist' }));
    await screen.findByRole('checkbox', { name: 'Top, level 1' });
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Add to watchlist' })
    );

    await waitFor(() => expect(setDoc).toHaveBeenCalledOnce());
    const [ref, data] = vi.mocked(setDoc).mock.calls[0] as unknown as [{ path: string }, object];
    expect(ref.path).toBe('users/u/items/tv_7');
    expect(data).toMatchObject({
      mediaType: 'tv',
      tmdbId: 7,
      title: 'Severance',
      posterPath: '/p.jpg',
    });
  });

  it('adds a new title to several folders and confirms it', async () => {
    const shown: NotificationPayload[] = [];
    const stopListening = createTypedListener('notification:show')((payload) => {
      shown.push(payload);
    });
    const { user } = renderButton();

    await user.click(trigger());
    await user.click(await screen.findByRole('checkbox', { name: 'Top, level 1' }));
    await user.click(screen.getByRole('checkbox', { name: 'Child, level 2' }));
    await user.click(screen.getByRole('button', { name: 'Add to watchlist' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(vi.mocked(setDoc).mock.calls[0]?.[1]).toMatchObject({ folderIds: ['top', 'child'] });
    expect(shown).toEqual([{ type: 'success', message: 'Dune is in your watchlist' }]);
    await waitFor(() => expect(trigger()).toHaveFocus());
    stopListening();
  });

  it('adds a new title with no folder chosen', async () => {
    mockReads([], []);
    const { user } = renderButton();

    await user.click(trigger());
    expect(await screen.findByText(/No folders yet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open watchlist' })).toHaveAttribute(
      'href',
      '/user/watchlist'
    );
    await user.click(screen.getByRole('button', { name: 'Add to watchlist' }));

    await waitFor(() => expect(setDoc).toHaveBeenCalledOnce());
    expect(vi.mocked(setDoc).mock.calls[0]?.[1]).toMatchObject({ folderIds: [] });
  });

  it('sends a difference, so a folder it never showed survives', async () => {
    mockReads(FOLDERS, [STORED]);
    const { user } = renderButton();

    await user.click(trigger());
    await user.click(await screen.findByRole('checkbox', { name: 'Top, level 1' }));
    await user.click(screen.getByRole('checkbox', { name: 'Child, level 2' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(batch.commit).toHaveBeenCalledOnce());
    expect(batch.update.mock.calls.map(([, data]) => data)).toEqual([
      { folderIds: { arrayUnion: ['child'] } },
      { folderIds: { arrayRemove: ['top'] } },
    ]);
  });

  it('sends only what changed, so a row left alone is not reasserted', async () => {
    mockReads(FOLDERS, [{ ...STORED, folderIds: ['top'] }]);
    const { user } = renderButton();

    await user.click(trigger());
    await user.click(await screen.findByRole('checkbox', { name: 'Child, level 2' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(batch.commit).toHaveBeenCalledOnce());
    expect(batch.update.mock.calls.map(([, data]) => data)).toEqual([
      { folderIds: { arrayUnion: ['child'] } },
    ]);
  });

  it('counts a tick taken back as no change', async () => {
    mockReads(FOLDERS, [STORED]);
    const { user } = renderButton();

    await user.click(trigger());
    const child = await screen.findByRole('checkbox', { name: 'Child, level 2' });
    await user.click(child);
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    await user.click(child);

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('ignores Enter on a folder, as only the button saves', async () => {
    const { user } = renderButton();

    await user.click(trigger());
    await screen.findByRole('checkbox', { name: 'Top, level 1' });
    expect(screen.getByRole('dialog')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('checkbox', { name: 'Top, level 1' })).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('forgets a folder deleted elsewhere, so a retry can succeed', async () => {
    const { user } = renderButton();

    await user.click(trigger());
    await user.click(await screen.findByRole('checkbox', { name: 'Top, level 1' }));
    await user.click(screen.getByRole('checkbox', { name: 'Child, level 2' }));
    mockReads([{ id: 'child', name: 'Child', parentId: null, depth: 1 }], []);
    await user.click(screen.getByRole('button', { name: 'Add to watchlist' }));

    await waitFor(() => expect(screen.queryByRole('checkbox', { name: /Top/ })).toBeNull());
    expect(setDoc).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Add to watchlist' }));

    await waitFor(() => expect(setDoc).toHaveBeenCalledOnce());
    expect(vi.mocked(setDoc).mock.calls[0]?.[1]).toMatchObject({ folderIds: ['child'] });
  });

  it('keeps the ticks and the dialog when a save fails', async () => {
    vi.mocked(setDoc).mockRejectedValue(
      Object.assign(new Error('failed'), { code: 'permission-denied' })
    );
    const { user } = renderButton();

    await user.click(trigger());
    await user.click(await screen.findByRole('checkbox', { name: 'Top, level 1' }));
    await user.click(screen.getByRole('button', { name: 'Add to watchlist' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Add to watchlist' })).toBeEnabled()
    );
    expect(screen.getByRole('checkbox', { name: 'Top, level 1' })).toBeChecked();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('tries a save at once while the browser reports no network', async () => {
    vi.mocked(setDoc).mockRejectedValue(
      Object.assign(new Error('failed'), { code: 'unavailable' })
    );
    const { user } = renderButton();

    await user.click(trigger());
    const folder = await screen.findByRole('checkbox', { name: 'Top, level 1' });
    await user.click(folder);
    onlineManager.setOnline(false);
    await user.click(screen.getByRole('button', { name: 'Add to watchlist' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Add to watchlist' })).toBeEnabled()
    );
    expect(setDoc).toHaveBeenCalledOnce();
    expect(folder).toBeChecked();
  });

  it('still confirms and refreshes both lists when the dialog closes during a write', async () => {
    const shown: NotificationPayload[] = [];
    const stopListening = createTypedListener('notification:show')((payload) => {
      shown.push(payload);
    });
    let land = () => {};
    vi.mocked(setDoc).mockReturnValue(
      new Promise<void>((resolve) => {
        land = resolve;
      })
    );
    const { user } = renderButton();

    await user.click(trigger());
    await screen.findByRole('checkbox', { name: 'Top, level 1' });
    await user.click(screen.getByRole('button', { name: 'Add to watchlist' }));
    await waitFor(() => expect(setDoc).toHaveBeenCalledOnce());
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    vi.mocked(getDocs).mockClear();
    land();

    await waitFor(() => expect(shown).toHaveLength(1));
    await waitFor(() => expect(getDocs).toHaveBeenCalledTimes(2));
    stopListening();
  });

  it('writes once for two clicks in one tick', async () => {
    const { user } = renderButton();

    await user.click(trigger());
    const submit = await screen.findByRole('button', { name: 'Add to watchlist' });
    submit.click();
    submit.click();

    await waitFor(() => expect(setDoc).toHaveBeenCalledOnce());
    expect(getDoc).toHaveBeenCalledOnce();
  });

  it('offers a retry when the folders cannot be read', async () => {
    vi.mocked(getDocs).mockRejectedValueOnce(
      Object.assign(new Error('failed'), { code: 'permission-denied' })
    );
    const { user } = renderButton();

    await user.click(trigger());
    expect(await screen.findByText('Your folders could not be loaded.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('checkbox', { name: 'Top, level 1' })).toBeInTheDocument();
  });

  it('returns focus to the button on Close', async () => {
    const { user } = renderButton();

    await user.click(trigger());
    await user.click(await screen.findByRole('button', { name: 'Close' }));

    await waitFor(() => expect(trigger()).toHaveFocus());
  });
});
