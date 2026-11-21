import { type AuthUser, globalStore } from '@repo/events';
import { expectNoA11yViolations, renderWithProviders, screen, server } from '@repo/test-utils';
import { getDocs } from 'firebase/firestore/lite';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WatchlistDownload } from '../watchlist-download';

vi.mock('firebase/app', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/app')>()),
  initializeApp: (options: object) => ({ options }),
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
  createdAt: null,
};
const FOLDERS = [{ id: 'horror', name: 'Horror', parentId: null, depth: 1 }];
const ITEMS = [
  {
    id: 'movie_1',
    mediaType: 'movie',
    tmdbId: 1,
    title: 'Scream',
    posterPath: null,
    status: 'watched',
    folderIds: ['horror'],
    addedAt: { toDate: () => new Date('2026-11-01T10:00:00Z') },
  },
];

function toSnapshot(rows: { id: string }[]) {
  return { docs: rows.map(({ id, ...data }) => ({ id, data: () => data })) };
}

describe('WatchlistDownload', () => {
  const createObjectURL = vi.fn((_blob: Blob) => 'blob:watchlist');
  const revokeObjectURL = vi.fn();
  let clicked: HTMLAnchorElement[];

  beforeEach(() => {
    vi.clearAllMocks();
    clicked = [];
    globalStore.getState().setUser(USER);
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }));
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      clicked.push(this);
    });
    vi.mocked(getDocs).mockImplementation((async (ref: { path: string }) =>
      toSnapshot(ref.path.endsWith('folders') ? FOLDERS : ITEMS)) as never);
    server.use(
      http.get('*/__/firebase/init.json', () =>
        HttpResponse.json({ apiKey: 'key', projectId: 'cinepulse-test' })
      )
    );
  });

  afterEach(() => {
    globalStore.getState().setUser(null);
    vi.restoreAllMocks();
  });

  it('downloads the watchlist as CSV', async () => {
    const { user } = renderWithProviders(<WatchlistDownload />);

    await user.click(screen.getByRole('button', { name: 'Download CSV' }));

    await vi.waitFor(() => expect(clicked).toHaveLength(1));
    expect(clicked[0]?.download).toMatch(/^cinepulse-watchlist-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(clicked[0]?.isConnected).toBe(false);
    const blob = createObjectURL.mock.calls[0]?.[0];
    await expect(blob?.text()).resolves.toContain(
      'Scream,movie,1,watched,2026-11-01T10:00:00.000Z,Horror'
    );
    await vi.waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith('blob:watchlist'));
    expect(screen.getByRole('button', { name: 'Download CSV' })).toBeEnabled();
  });

  it('downloads the watchlist as JSON', async () => {
    const { user } = renderWithProviders(<WatchlistDownload />);

    await user.click(screen.getByRole('button', { name: 'Download JSON' }));

    await vi.waitFor(() => expect(clicked).toHaveLength(1));
    expect(clicked[0]?.download).toMatch(/\.json$/);
    const data = JSON.parse((await createObjectURL.mock.calls[0]?.[0].text()) ?? '');
    expect(data.titles).toEqual([expect.objectContaining({ title: 'Scream' })]);
  });

  it('says so when the watchlist cannot be read', async () => {
    vi.mocked(getDocs).mockRejectedValue(new Error('unavailable'));
    const { user } = renderWithProviders(<WatchlistDownload />);

    await user.click(screen.getByRole('button', { name: 'Download JSON' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your watchlist could not be downloaded. Try again.'
    );
    expect(clicked).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Download JSON' })).toBeEnabled();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<WatchlistDownload />);

    await expectNoA11yViolations(container);
  });
});
