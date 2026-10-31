import { globalStore } from '@repo/events';
import { watchlistQueries } from '@repo/firebase';
import {
  expectNoA11yViolations,
  fireEvent,
  renderWithProviders,
  screen,
  server,
  waitFor,
  within,
} from '@repo/test-utils';
import { PageBoundary } from '@repo/ui';
import { onlineManager } from '@tanstack/react-query';
import { getDocs, setDoc, updateDoc, writeBatch } from 'firebase/firestore/lite';
import { HttpResponse, http } from 'msw';
import { useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WatchlistPage } from '../watchlist-page';

vi.mock('firebase/app', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/app')>()),
  initializeApp: (options: object) => ({ options }),
}));
vi.mock('firebase/firestore/lite', () => ({
  arrayRemove: (...ids: string[]) => ({ arrayRemove: ids }),
  collection: (_db: unknown, ...path: string[]) => ({ path: path.join('/') }),
  connectFirestoreEmulator: vi.fn(),
  doc: (_first: unknown, ...path: string[]) => ({ path: path.join('/') }),
  getDocs: vi.fn(),
  getFirestore: () => ({}),
  orderBy: vi.fn(),
  query: (ref: unknown) => ref,
  serverTimestamp: () => 'now',
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  writeBatch: vi.fn(),
}));

type FolderRow = { id: string; name: string; parentId: string | null; depth: number };

const TOP: FolderRow = { id: 'top', name: 'Top', parentId: null, depth: 1 };
const CHILD: FolderRow = { id: 'child', name: 'Child', parentId: 'top', depth: 2 };
const DEEP: FolderRow = { id: 'deep', name: 'Deep', parentId: 'top', depth: 6 };
const OTHER: FolderRow = { id: 'other', name: 'Other', parentId: null, depth: 1 };

const ALIEN = {
  id: 'movie_1',
  mediaType: 'movie',
  tmdbId: 1,
  title: 'Alien',
  posterPath: null,
  status: 'planned',
  folderIds: ['top'],
};
const LOST = {
  id: 'tv_2',
  mediaType: 'tv',
  tmdbId: 2,
  title: 'Lost',
  posterPath: null,
  status: 'watched',
  folderIds: [],
};

let folders: FolderRow[];
const batch = { commit: vi.fn(), delete: vi.fn(), update: vi.fn() };

function toSnapshot(rows: { id: string }[]) {
  return { docs: rows.map(({ id, ...data }) => ({ id, data: () => data })) };
}

function countReads(collectionName: string): number {
  return vi
    .mocked(getDocs)
    .mock.calls.filter(([ref]) =>
      (ref as unknown as { path: string }).path.endsWith(collectionName)
    ).length;
}

function statusOf(title: string, status: string) {
  const group = screen.getByRole('radiogroup', { name: `Status of ${title}` });
  return within(group).getByRole('radio', { name: status });
}

/** A held write: the returned function lands it. */
function holdWrite(result: () => Promise<void> = () => Promise.resolve()) {
  let land = () => {};
  vi.mocked(updateDoc).mockImplementationOnce(() =>
    new Promise<void>((resolve) => {
      land = resolve;
    }).then(result)
  );
  return () => land();
}

function LocationKey() {
  return <span data-testid="location-key">{useLocation().key}</span>;
}

function renderPage(route = '/user/watchlist') {
  return renderWithProviders(
    <PageBoundary>
      <WatchlistPage />
      <LocationKey />
    </PageBoundary>,
    { route }
  );
}

describe('WatchlistPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    folders = [TOP, CHILD, DEEP, OTHER];
    globalStore.getState().setUser({ uid: 'u', displayName: null, email: null, photoUrl: null });
    server.use(
      http.get('*/__/firebase/init.json', () =>
        HttpResponse.json({ apiKey: 'key', projectId: 'cinepulse-test' })
      )
    );
    vi.mocked(writeBatch).mockReturnValue(batch as never);
    vi.mocked(getDocs).mockImplementation((async (ref: { path: string }) =>
      toSnapshot(ref.path.endsWith('folders') ? folders : [ALIEN, LOST])) as never);
  });

  afterEach(() => {
    onlineManager.setOnline(true);
    globalStore.getState().setUser(null);
  });

  it('shows every title and the whole tree by default', async () => {
    renderPage();

    expect(await screen.findByRole('link', { name: 'Top, level 1' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Child, level 2' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All titles' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('heading', { level: 2, name: 'All titles' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Alien' })).toHaveAttribute('href', '/movies/1');
    expect(screen.getByText('Lost')).toBeVisible();
  });

  it('shows only the titles of the selected folder', async () => {
    renderPage('/user/watchlist?folder=top');

    expect(await screen.findByRole('heading', { level: 2, name: 'Top' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Alien' })).toBeInTheDocument();
    expect(screen.queryByText('Lost')).not.toBeInTheDocument();
  });

  it('marks the chosen folder and leaves focus on its link', async () => {
    const { user } = renderPage();
    const link = await screen.findByRole('link', { name: 'Top, level 1' });

    link.focus();
    await user.keyboard('{Enter}');

    await screen.findByRole('heading', { level: 2, name: 'Top' });
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveFocus();
  });

  it('shows the empty state for a folder without titles', async () => {
    renderPage('/user/watchlist?folder=other');

    expect(await screen.findByText('No titles here yet.')).toBeInTheDocument();
  });

  it('keeps the other search params when a folder is chosen', async () => {
    renderPage('/user/watchlist?folder=top&status=watched');

    expect(await screen.findByRole('link', { name: 'Other, level 1' })).toHaveAttribute(
      'href',
      '/user/watchlist?folder=other&status=watched'
    );
    expect(screen.getByRole('link', { name: 'All titles' })).toHaveAttribute(
      'href',
      '/user/watchlist?status=watched'
    );
  });

  it('keeps the other search params when a folder goes', async () => {
    const { user } = renderPage('/user/watchlist?folder=child&status=watched');

    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    vi.mocked(batch.commit).mockResolvedValue(undefined);
    await user.click(await screen.findByRole('button', { name: 'Delete folder' }));

    await screen.findByRole('heading', { level: 2, name: 'Top' });
    expect(screen.getByRole('link', { name: 'All titles' })).toHaveAttribute(
      'href',
      '/user/watchlist?status=watched'
    );
  });

  it('treats an unknown folder as All titles', async () => {
    renderPage('/user/watchlist?folder=gone');

    expect(
      await screen.findByRole('heading', { level: 2, name: 'All titles' })
    ).toBeInTheDocument();
  });

  it('renders a TV title as text until its details page exists', async () => {
    renderPage();

    await screen.findByText('Lost');
    expect(screen.queryByRole('link', { name: 'Lost' })).not.toBeInTheDocument();
  });

  it('shows the stored status of each title, on a show too', async () => {
    renderPage();

    await screen.findByRole('link', { name: 'Alien' });
    expect(statusOf('Alien', 'Planned')).toBeChecked();
    expect(statusOf('Alien', 'Watched')).not.toBeChecked();
    expect(statusOf('Lost', 'Watched')).toBeChecked();
  });

  it('shows a new status at once, stores it, and reads nothing for it', async () => {
    vi.mocked(updateDoc).mockResolvedValue(undefined);
    const { user } = renderPage();
    await screen.findByRole('link', { name: 'Alien' });
    const reads = countReads('items');

    await user.click(statusOf('Alien', 'Watched'));

    expect(statusOf('Alien', 'Watched')).toBeChecked();
    await waitFor(() =>
      expect(updateDoc).toHaveBeenCalledExactlyOnceWith(
        { path: 'users/u/items/movie_1' },
        { status: 'watched' }
      )
    );
    await waitFor(() => expect(statusOf('Alien', 'Watched')).toBeChecked());
    expect(statusOf('Alien', 'Watched')).toHaveFocus();
    expect(countReads('items')).toBe(reads);
  });

  it('does nothing for a press on the status a title already has', async () => {
    const { user } = renderPage();
    await screen.findByRole('link', { name: 'Alien' });

    await user.click(statusOf('Alien', 'Planned'));

    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('never disables the switch, so focus stays on it during a write', async () => {
    const land = holdWrite();
    const { user } = renderPage();
    await screen.findByRole('link', { name: 'Alien' });

    await user.click(statusOf('Alien', 'Watched'));

    await waitFor(() => expect(updateDoc).toHaveBeenCalled());
    expect(statusOf('Alien', 'Planned')).toBeEnabled();
    expect(statusOf('Alien', 'Watched')).toHaveFocus();
    land();
  });

  it('returns to the stored status and rereads the titles when a write fails', async () => {
    vi.mocked(updateDoc).mockRejectedValue(
      Object.assign(new Error('failed'), { code: 'permission-denied' })
    );
    const { user } = renderPage();
    await screen.findByRole('link', { name: 'Alien' });
    const reads = countReads('items');

    await user.click(statusOf('Alien', 'Watched'));

    await waitFor(() => expect(statusOf('Alien', 'Planned')).toBeChecked());
    await waitFor(() => expect(countReads('items')).toBe(reads + 1));
    expect(statusOf('Alien', 'Planned')).toBeInTheDocument();
  });

  it('tries a write at once while offline', async () => {
    vi.mocked(updateDoc).mockRejectedValue(
      Object.assign(new Error('failed'), { code: 'unavailable' })
    );
    const { user } = renderPage();
    await screen.findByRole('link', { name: 'Alien' });
    onlineManager.setOnline(false);

    await user.click(statusOf('Alien', 'Watched'));

    await waitFor(() => expect(updateDoc).toHaveBeenCalledOnce());
    await waitFor(() => expect(statusOf('Alien', 'Planned')).toBeChecked());
  });

  it('runs the writes of a title in order, so the last press wins', async () => {
    const land = holdWrite();
    vi.mocked(updateDoc).mockResolvedValue(undefined);
    const { user } = renderPage();
    await screen.findByRole('link', { name: 'Alien' });

    await user.click(statusOf('Alien', 'Watched'));
    await waitFor(() => expect(updateDoc).toHaveBeenCalledOnce());
    await user.click(statusOf('Alien', 'Planned'));

    expect(statusOf('Alien', 'Planned')).toBeChecked();
    expect(updateDoc).toHaveBeenCalledOnce();

    land();
    await waitFor(() => expect(updateDoc).toHaveBeenCalledTimes(2));
    expect(vi.mocked(updateDoc).mock.calls[1]?.[1]).toEqual({ status: 'planned' });
    await waitFor(() => expect(statusOf('Alien', 'Planned')).toBeChecked());
  });

  it('shows the first press landed when a correction fails', async () => {
    const land = holdWrite();
    vi.mocked(updateDoc).mockRejectedValueOnce(
      Object.assign(new Error('failed'), { code: 'permission-denied' })
    );
    const { user } = renderPage();
    await screen.findByRole('link', { name: 'Alien' });
    const watched = [{ ...ALIEN, status: 'watched' }, LOST];
    vi.mocked(getDocs).mockImplementation((async (ref: { path: string }) =>
      toSnapshot(ref.path.endsWith('folders') ? folders : watched)) as never);

    await user.click(statusOf('Alien', 'Watched'));
    await waitFor(() => expect(updateDoc).toHaveBeenCalledOnce());
    await user.click(statusOf('Alien', 'Planned'));
    land();

    await waitFor(() => expect(updateDoc).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(statusOf('Alien', 'Watched')).toBeChecked());
  });

  it('does not let a read from before the commit bring the old status back', async () => {
    vi.mocked(updateDoc).mockResolvedValue(undefined);
    const { user, queryClient } = renderPage();
    await screen.findByRole('link', { name: 'Alien' });
    let finishRead = () => {};
    vi.mocked(getDocs).mockImplementationOnce(
      (() =>
        new Promise((resolve) => {
          finishRead = () => resolve(toSnapshot([ALIEN, LOST]));
        })) as never
    );
    void queryClient.refetchQueries({ queryKey: watchlistQueries.items('u').queryKey });

    await user.click(statusOf('Alien', 'Watched'));
    await waitFor(() => expect(updateDoc).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(queryClient.isFetching({ queryKey: watchlistQueries.items('u').queryKey })).toBe(0)
    );
    finishRead();

    await waitFor(() =>
      expect(
        queryClient
          .getQueryData(watchlistQueries.items('u').queryKey)
          ?.find(({ id }) => id === ALIEN.id)?.status
      ).toBe('watched')
    );
    expect(statusOf('Alien', 'Watched')).toBeChecked();
  });

  it('shows only the titles of the chosen status, and counts them', async () => {
    const { user } = renderPage();
    await screen.findByRole('link', { name: 'Alien' });
    expect(screen.getByText('2 titles')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Watched' }));

    await waitFor(() => expect(screen.queryByRole('link', { name: 'Alien' })).toBeNull());
    expect(screen.getByText('Lost')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 title');
    expect(screen.getByRole('button', { name: 'Watched' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('filters within the selected folder and survives a change of folder', async () => {
    const { user } = renderPage('/user/watchlist?folder=top&status=watched');

    expect(await screen.findByText('No watched titles here.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('No watched titles here.');

    await user.click(screen.getByRole('link', { name: 'All titles' }));

    expect(await screen.findByText('Lost')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Watched' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('link', { name: 'Alien' })).not.toBeInTheDocument();
  });

  it('keeps the folder in the URL when the filter changes', async () => {
    const { user } = renderPage('/user/watchlist?folder=top');
    await screen.findByRole('link', { name: 'Alien' });

    await user.click(screen.getByRole('button', { name: 'Planned' }));
    await user.click(screen.getByRole('button', { name: 'All' }));

    expect(screen.getByRole('heading', { level: 2, name: 'Top' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Alien' })).toBeInTheDocument();
  });

  it('treats an unknown status as all of them', async () => {
    renderPage('/user/watchlist?status=dropped');

    expect(await screen.findByRole('link', { name: 'Alien' })).toBeInTheDocument();
    expect(screen.getByText('Lost')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('adds no history entry for a press on the chosen filter', async () => {
    const { user } = renderPage('/user/watchlist?status=planned');
    await screen.findByRole('link', { name: 'Alien' });
    const key = screen.getByTestId('location-key').textContent;

    await user.click(screen.getByRole('button', { name: 'Planned' }));

    expect(screen.getByTestId('location-key').textContent).toBe(key);
  });

  it('keeps a row changed under a filter, with its focus, until the view changes', async () => {
    vi.mocked(updateDoc).mockResolvedValue(undefined);
    const { user } = renderPage('/user/watchlist?status=planned');
    await screen.findByRole('link', { name: 'Alien' });

    await user.click(statusOf('Alien', 'Watched'));

    await waitFor(() => expect(updateDoc).toHaveBeenCalledOnce());
    await waitFor(() => expect(statusOf('Alien', 'Watched')).toBeChecked());
    expect(statusOf('Alien', 'Watched')).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('1 title');

    await user.click(screen.getByRole('button', { name: 'Planned' }));
    expect(screen.getByRole('link', { name: 'Alien' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Watched' }));
    expect(screen.getByRole('link', { name: 'Alien' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Planned' }));

    await waitFor(() => expect(screen.queryByRole('link', { name: 'Alien' })).toBeNull());
    expect(screen.getByRole('status')).toHaveTextContent('No planned titles here.');
  });

  it('does not bring back a kept row with its filter', async () => {
    vi.mocked(updateDoc).mockResolvedValue(undefined);
    const { user } = renderPage('/user/watchlist?status=planned');
    await screen.findByRole('link', { name: 'Alien' });

    await user.click(statusOf('Alien', 'Watched'));
    await waitFor(() => expect(updateDoc).toHaveBeenCalledOnce());
    await waitFor(() => expect(statusOf('Alien', 'Watched')).toBeChecked());

    await user.click(screen.getByRole('button', { name: 'All' }));
    await user.click(screen.getByRole('button', { name: 'Planned' }));

    await waitFor(() => expect(screen.queryByRole('link', { name: 'Alien' })).toBeNull());
  });

  it('offers no subfolder at the last level and says why', async () => {
    renderPage('/user/watchlist?folder=deep');

    expect(await screen.findByRole('button', { name: 'New subfolder' })).toBeDisabled();
    expect(
      screen.getByText('Folders go 6 levels deep, so this one cannot hold subfolders.')
    ).toBeInTheDocument();
  });

  it('creates a trimmed folder, rereads only folders and returns focus', async () => {
    const { user } = renderPage();
    await user.click(await screen.findByRole('button', { name: 'New folder' }));
    const readsBefore = countReads('items');

    await user.type(screen.getByLabelText('New folder'), '  Noir ');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ name: 'Noir', parentId: null, depth: 1 })
      )
    );
    expect(await screen.findByRole('button', { name: 'New folder' })).toHaveFocus();
    expect(countReads('items')).toBe(readsBefore);
  });

  it('creates a subfolder one level below the selected folder', async () => {
    const { user } = renderPage('/user/watchlist?folder=top');
    await user.click(await screen.findByRole('button', { name: 'New subfolder' }));

    await user.type(screen.getByLabelText('New folder in Top'), 'Noir');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ name: 'Noir', parentId: 'top', depth: 2 })
      )
    );
  });

  it('keeps Save disabled for a blank name', async () => {
    const { user } = renderPage();
    await user.click(await screen.findByRole('button', { name: 'New folder' }));

    await user.type(screen.getByLabelText('New folder'), '   ');

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('renames the folder and returns focus to Rename', async () => {
    const { user } = renderPage('/user/watchlist?folder=top');
    await user.click(await screen.findByRole('button', { name: 'Rename' }));

    const input = screen.getByLabelText('Rename Top');
    await user.clear(input);
    await user.type(input, 'Best');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { name: 'Best' })
    );
    expect(await screen.findByRole('button', { name: 'Rename' })).toHaveFocus();
  });

  it('locks the form until the write lands', async () => {
    let finishWrite = () => {};
    vi.mocked(setDoc).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishWrite = resolve;
        })
    );
    const { user } = renderPage();
    await user.click(await screen.findByRole('button', { name: 'New folder' }));
    await user.type(screen.getByLabelText('New folder'), 'Noir');

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(setDoc).toHaveBeenCalled());

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    finishWrite();
    expect(await screen.findByRole('button', { name: 'New folder' })).toBeEnabled();
  });

  it('sends one write when a busy page delivers two clicks at once', async () => {
    const { user } = renderPage();
    await user.click(await screen.findByRole('button', { name: 'New folder' }));
    await user.type(screen.getByLabelText('New folder'), 'Noir');
    const save = screen.getByRole('button', { name: 'Save' });

    fireEvent.click(save);
    fireEvent.click(save);

    await screen.findByRole('button', { name: 'New folder' });
    expect(setDoc).toHaveBeenCalledOnce();
  });

  it('keeps the form and its text when a write fails', async () => {
    vi.mocked(setDoc).mockRejectedValueOnce(
      Object.assign(new Error('denied'), { code: 'permission-denied' })
    );
    const { user } = renderPage();
    await user.click(await screen.findByRole('button', { name: 'New folder' }));

    await user.type(screen.getByLabelText('New folder'), 'Noir');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled());
    expect(screen.getByLabelText('New folder')).toHaveValue('Noir');
  });

  it('fails a write at once while offline instead of pausing with the form locked', async () => {
    vi.mocked(setDoc).mockRejectedValueOnce(
      Object.assign(new Error('offline'), { code: 'unknown' })
    );
    const { user } = renderPage();
    await user.click(await screen.findByRole('button', { name: 'New folder' }));
    await user.type(screen.getByLabelText('New folder'), 'Noir');

    onlineManager.setOnline(false);
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(setDoc).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled());
  });

  it('offers only the moves that keep the tree valid', async () => {
    const { user } = renderPage('/user/watchlist?folder=child');
    await user.click(await screen.findByRole('button', { name: 'Move' }));

    const options = screen.getAllByRole('option').map((option) => option.textContent?.trim());

    expect(options).toEqual(['Top level', 'Other']);
  });

  it('moves the folder to the chosen parent', async () => {
    const { user } = renderPage('/user/watchlist?folder=child');
    await user.click(await screen.findByRole('button', { name: 'Move' }));

    await user.selectOptions(screen.getByLabelText('Move Child to'), 'other');
    await user.click(screen.getByRole('button', { name: 'Move' }));

    await waitFor(() => expect(batch.commit).toHaveBeenCalled());
    expect(batch.update.mock.calls.map(([ref, data]) => [ref.path, data])).toEqual([
      ['users/u/folders/child', { parentId: 'other', depth: 2 }],
    ]);
    expect(await screen.findByRole('button', { name: 'Move' })).toHaveFocus();
    expect(screen.queryByLabelText('Move Child to')).not.toBeInTheDocument();
  });

  it('names each move target by its path', async () => {
    const { user } = renderPage('/user/watchlist?folder=other');
    await user.click(await screen.findByRole('button', { name: 'Move' }));

    const options = screen.getAllByRole('option').map((option) => option.textContent);

    expect(options).toEqual(['Top', 'Top / Child']);
  });

  it('submits the target it shows after a refused move', async () => {
    const { user } = renderPage('/user/watchlist?folder=child');
    await user.click(await screen.findByRole('button', { name: 'Move' }));
    const select = screen.getByLabelText('Move Child to');
    await user.selectOptions(select, 'other');

    folders = [TOP, CHILD];
    await user.click(screen.getByRole('button', { name: 'Move' }));

    await waitFor(() => expect(screen.getByLabelText('Move Child to')).toHaveValue(''));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Move' })).toBeEnabled());
    expect(batch.commit).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Move' }));

    await waitFor(() => expect(batch.commit).toHaveBeenCalled());
    expect(batch.update.mock.calls.map(([ref, data]) => [ref.path, data])).toEqual([
      ['users/u/folders/child', { parentId: null, depth: 1 }],
    ]);
  });

  it('says when a folder has nowhere to go', async () => {
    folders = [OTHER];
    const { user } = renderPage('/user/watchlist?folder=other');
    await user.click(await screen.findByRole('button', { name: 'Move' }));

    expect(
      screen.getByRole('group', { name: 'There is nowhere to move this folder.' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('asks before deleting, with Cancel focused', async () => {
    const { user } = renderPage('/user/watchlist?folder=top');
    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(
      screen.getByRole('group', {
        name: 'Delete Top and 2 subfolders? Titles stay in your watchlist.',
      })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    expect(batch.commit).not.toHaveBeenCalled();
  });

  it('keeps the toolbar in place and locked under the delete question', async () => {
    const { user } = renderPage('/user/watchlist?folder=top');
    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Rename' })).toBeDisabled();
  });

  it('returns focus to Delete after every Cancel', async () => {
    const { user } = renderPage('/user/watchlist?folder=top');

    for (let round = 0; round < 2; round += 1) {
      await user.click(await screen.findByRole('button', { name: 'Delete' }));
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.getByRole('button', { name: 'Delete' })).toHaveFocus();
    }
  });

  it('asks about the folders the server has now', async () => {
    const { user } = renderPage('/user/watchlist?folder=other');
    const button = await screen.findByRole('button', { name: 'Delete' });
    folders = [...folders, { id: 'late', name: 'Late', parentId: 'other', depth: 2 }];

    await user.click(button);

    expect(
      await screen.findByRole('group', {
        name: 'Delete Other and 1 subfolder? Titles stay in your watchlist.',
      })
    ).toBeInTheDocument();
  });

  it('selects the parent and focuses the heading after a delete', async () => {
    batch.commit.mockImplementationOnce(async () => {
      folders = [TOP, DEEP, OTHER];
    });
    const { user } = renderPage('/user/watchlist?folder=child');
    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    await user.click(screen.getByRole('button', { name: 'Delete folder' }));

    const heading = await screen.findByRole('heading', { level: 2, name: 'Top' });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.queryByRole('link', { name: 'Child, level 2' })).not.toBeInTheDocument();
  });

  it('keeps a folder picked while a delete was running', async () => {
    let finishCommit = () => {};
    batch.commit.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishCommit = () => {
            folders = [TOP, DEEP, OTHER];
            resolve();
          };
        })
    );
    const { user } = renderPage('/user/watchlist?folder=child');
    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Delete folder' }));
    await waitFor(() => expect(batch.commit).toHaveBeenCalled());

    await user.click(screen.getByRole('link', { name: 'Other, level 1' }));
    finishCommit();

    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'Child, level 2' })).not.toBeInTheDocument()
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Other' })).toBeInTheDocument();
  });

  it('focuses the heading when a failed write finds its folder gone', async () => {
    vi.mocked(setDoc).mockRejectedValueOnce(
      Object.assign(new Error('denied'), { code: 'permission-denied' })
    );
    const { user } = renderPage('/user/watchlist?folder=other');
    await user.click(await screen.findByRole('button', { name: 'New subfolder' }));
    await user.type(screen.getByLabelText('New folder in Other'), 'Noir');
    folders = [TOP, CHILD, DEEP];

    await user.keyboard('{Enter}');

    const heading = await screen.findByRole('heading', { level: 2, name: 'All titles' });
    await waitFor(() => expect(heading).toHaveFocus());
  });

  it('shows the page error with a retry when the first read fails', async () => {
    vi.mocked(getDocs).mockRejectedValue(
      Object.assign(new Error('offline'), { code: 'unavailable' })
    );
    const { user } = renderPage();

    await user.click(await screen.findByRole('button', { name: 'Try again' }));
    vi.mocked(getDocs).mockImplementation((async (ref: { path: string }) =>
      toSnapshot(ref.path.endsWith('folders') ? folders : [ALIEN, LOST])) as never);
    await user.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Watchlist' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderPage('/user/watchlist?folder=top');

    await screen.findByRole('link', { name: 'Alien' });
    await expectNoA11yViolations(container);
  });
});
