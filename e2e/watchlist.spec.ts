import { type APIRequestContext, expect, type Locator, type Page, test } from '@playwright/test';
import { signIn } from './sign-in';
import { FULL_MOVIE_ID, mockTmdb, paginated } from './tmdb-mock';

const FIRESTORE_DOCUMENTS =
  'http://127.0.0.1:5012/v1/projects/demo-cinepulse/databases/(default)/documents';

// The enforced CSP does not allow the local emulators, which the demo project talks to.
test.use({ bypassCSP: true });

test.beforeEach(async ({ page }) => {
  await mockTmdb(page);
});

async function openWatchlist(page: Page) {
  await page.goto('/user/watchlist');
  await signIn(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Watchlist' })).toBeVisible();
}

function folderLink(page: Page, name: string, level: number) {
  return page.getByRole('link', { name: `${name}, level ${level}`, exact: true });
}

async function createFolder(page: Page, button: string, name: string, level: number) {
  await page.getByRole('button', { name: button, exact: true }).click();
  await page.getByRole('textbox').fill(name);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(folderLink(page, name, level)).toBeVisible();
}

async function selectFolder(page: Page, name: string, level: number) {
  await folderLink(page, name, level).click();
  await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
}

function getUid(page: Page): Promise<string> {
  return page.evaluate(() => window.__CINEPULSE_STORE__?.getState().user?.uid ?? '');
}

function getFolderId(page: Page): string {
  return new URL(page.url()).searchParams.get('folder') ?? '';
}

/** Admin access through the emulator: seeds a state the UI has no way to produce on demand. */
async function seedTitle(
  request: APIRequestContext,
  uid: string,
  tmdbId: number,
  title: string,
  folderIds: string[],
  { status = 'planned', addedAt = new Date().toISOString() } = {}
) {
  const response = await request.post(
    `${FIRESTORE_DOCUMENTS}/users/${uid}/items?documentId=movie_${tmdbId}`,
    {
      headers: { Authorization: 'Bearer owner' },
      data: {
        fields: {
          mediaType: { stringValue: 'movie' },
          tmdbId: { integerValue: String(tmdbId) },
          title: { stringValue: title },
          posterPath: { nullValue: null },
          status: { stringValue: status },
          folderIds: { arrayValue: { values: folderIds.map((stringValue) => ({ stringValue })) } },
          addedAt: { timestampValue: addedAt },
        },
      },
    }
  );
  expect(response.ok()).toBe(true);
}

test('folders nest six levels deep, rename and move', async ({ page }) => {
  await openWatchlist(page);
  await expect(page.getByText('No titles here yet.')).toBeVisible();

  await createFolder(page, 'New folder', 'L1', 1);
  await selectFolder(page, 'L1', 1);
  for (let level = 2; level <= 6; level += 1) {
    await createFolder(page, 'New subfolder', `L${level}`, level);
    await selectFolder(page, `L${level}`, level);
  }
  await expect(page.getByRole('button', { name: 'New subfolder' })).toBeDisabled();
  await expect(page.getByText('Folders go 6 levels deep')).toBeVisible();

  await createFolder(page, 'New folder', 'Other', 1);
  await selectFolder(page, 'Other', 1);
  await page.getByRole('button', { name: 'Rename' }).click();
  await page.getByRole('textbox').fill('Renamed');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(folderLink(page, 'Renamed', 1)).toBeVisible();

  await selectFolder(page, 'L5', 5);
  await page.getByRole('button', { name: 'Move' }).click();
  await page.getByRole('combobox').selectOption({ label: 'Renamed' });
  await page.getByRole('button', { name: 'Move' }).click();
  await expect(folderLink(page, 'L5', 2)).toBeVisible();
  await expect(folderLink(page, 'L6', 3)).toBeVisible();
});

test('deleting a folder keeps its titles and removes only that branch', async ({
  page,
  request,
}) => {
  await openWatchlist(page);
  await createFolder(page, 'New folder', 'Keep', 1);
  await selectFolder(page, 'Keep', 1);
  const keepId = getFolderId(page);
  await createFolder(page, 'New folder', 'Parent', 1);
  await selectFolder(page, 'Parent', 1);
  await createFolder(page, 'New subfolder', 'Child', 2);
  await selectFolder(page, 'Child', 2);
  const childId = getFolderId(page);

  const uid = await getUid(page);
  await seedTitle(request, uid, 1, 'In both', [childId, keepId]);
  await seedTitle(request, uid, 2, 'Only deleted', [childId]);
  await page.reload();

  await selectFolder(page, 'Parent', 1);
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('Delete Parent and 1 subfolder?')).toBeVisible();
  await page.getByRole('button', { name: 'Delete folder' }).click();

  await expect(folderLink(page, 'Parent', 1)).toHaveCount(0);
  await expect(folderLink(page, 'Child', 2)).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 2, name: 'All titles' })).toBeFocused();
  await expect(page.getByRole('link', { name: 'In both' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Only deleted' })).toBeVisible();

  await page.reload();
  await selectFolder(page, 'Keep', 1);
  await expect(page.getByRole('link', { name: 'In both' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Only deleted' })).toHaveCount(0);
});

test('a delete names and removes a subfolder made in another tab', async ({ page, context }) => {
  await openWatchlist(page);
  await createFolder(page, 'New folder', 'Parent', 1);
  await selectFolder(page, 'Parent', 1);

  const otherTab = await context.newPage();
  await mockTmdb(otherTab);
  await otherTab.goto(page.url());
  await expect(otherTab.getByRole('heading', { level: 2, name: 'Parent' })).toBeVisible();
  await createFolder(otherTab, 'New subfolder', 'Late child', 2);
  await otherTab.close();

  await expect(folderLink(page, 'Late child', 2)).toHaveCount(0);
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('Delete Parent and 1 subfolder?')).toBeVisible();
  await page.getByRole('button', { name: 'Delete folder' }).click();
  await expect(folderLink(page, 'Parent', 1)).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Watchlist' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Late child/ })).toHaveCount(0);
});

test('a failed write shows a toast and keeps the form', async ({ page }) => {
  await openWatchlist(page);
  await page.route(/documents:commit/, (route) => route.abort());

  await page.getByRole('button', { name: 'New folder' }).click();
  await page.getByRole('textbox').fill('Offline');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('Could not reach the server. Check your connection.')).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveValue('Offline');
  await expect(page.getByRole('button', { name: 'Save' })).toBeFocused();
});

test('a delete still running does not pull the person back', async ({ page }) => {
  await openWatchlist(page);
  await createFolder(page, 'New folder', 'Slow', 1);
  await selectFolder(page, 'Slow', 1);

  await page.route(/documents:commit/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    await route.continue();
  });
  const commit = page.waitForResponse(/documents:commit/);
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Delete folder' }).click();
  await page.getByRole('link', { name: 'Movies', exact: true }).first().click();
  await expect(page).toHaveURL(/\/movies$/);

  await commit;
  await expect(page).toHaveURL(/\/movies$/);
  await expect(page).toHaveTitle(/Movies/);
});

test('a double click on Delete still asks first', async ({ page }) => {
  await openWatchlist(page);
  await createFolder(page, 'New folder', 'Keep', 1);
  await selectFolder(page, 'Keep', 1);

  // At these widths the toolbar wraps so that Delete sits right over what comes below it.
  for (const width of [430, 820]) {
    await page.setViewportSize({ width, height: 800 });
    await page.getByRole('button', { name: 'Delete', exact: true }).dblclick();
    await expect(page.getByText('Delete Keep?')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(folderLink(page, 'Keep', 1)).toBeVisible();
  }
});

test('the selected folder stays in view in the short tree of a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await openWatchlist(page);
  for (let index = 0; index < 10; index += 1) {
    await createFolder(page, 'New folder', `F${index}`, 1);
  }
  await selectFolder(page, 'F9', 1);

  await page.reload();

  await expect(page.getByRole('heading', { level: 2, name: 'F9' })).toBeVisible();
  await expect(folderLink(page, 'F9', 1)).toBeInViewport();
});

test('a whole title row opens the title', async ({ page, request }) => {
  await openWatchlist(page);
  await seedTitle(request, await getUid(page), 1, 'Row', []);
  await page.reload();

  await page.getByRole('listitem').filter({ hasText: 'Planned' }).click();

  await expect(page).toHaveURL(/\/movies\/1$/);
});

test('a long unbroken name does not widen the page on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await openWatchlist(page);
  await createFolder(page, 'New folder', 'x'.repeat(100), 1);
  await selectFolder(page, 'x'.repeat(100), 1);

  for (const action of ['Rename', 'Move', 'Delete']) {
    await page.getByRole('button', { name: action }).click();
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(320);
    await page.getByRole('button', { name: 'Cancel' }).click();
  }
});

test('Firestore runs from the host singleton with the signed-in user', async ({ page }) => {
  const storeChunks: string[] = [];
  const firestoreRequests: (string | undefined)[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname.includes('watchlist-store')) storeChunks.push(url.pathname);
    if (url.port === '5012' && request.method() !== 'OPTIONS') {
      firestoreRequests.push(request.headers().authorization);
    }
  });

  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Popular' })).toBeVisible();
  expect(storeChunks).toEqual([]);

  await openWatchlist(page);
  await createFolder(page, 'New folder', 'Signed', 1);

  expect(storeChunks.length).toBeGreaterThan(0);
  expect(storeChunks.every((path) => path.startsWith('/assets/'))).toBe(true);
  expect(firestoreRequests.length).toBeGreaterThan(0);
  expect(firestoreRequests.every((header) => header?.startsWith('Bearer '))).toBe(true);
});

const MOVIE = 'Any movie 1';
const MOVIE_ID = 100;

function addButton(scope: Page | Locator, title = MOVIE) {
  return scope.getByRole('button', { name: `Add ${title} to your watchlist` }).first();
}

function folderBox(page: Page, name: string, level: number) {
  return page.getByRole('checkbox', { name: `${name}, level ${level}` });
}

async function readTitle(request: APIRequestContext, uid: string, id: string) {
  const response = await request.get(`${FIRESTORE_DOCUMENTS}/users/${uid}/items/${id}`, {
    headers: { Authorization: 'Bearer owner' },
  });
  expect(response.ok()).toBe(true);
  const { fields } = await response.json();
  return {
    status: fields.status.stringValue as string,
    addedAt: fields.addedAt.timestampValue as string,
    folderIds: (fields.folderIds.arrayValue.values ?? []).map(
      ({ stringValue }: { stringValue: string }) => stringValue
    ) as string[],
  };
}

/** One id per name, in order, so a caller destructures them without checking for a missing one. */
async function makeFolders<const Names extends readonly string[]>(page: Page, names: Names) {
  const ids: string[] = [];
  for (const name of names) {
    await createFolder(page, 'New folder', name, 1);
    await selectFolder(page, name, 1);
    ids.push(getFolderId(page));
  }
  return ids as { -readonly [Index in keyof Names]: string };
}

function openMovies(page: Page) {
  return page.getByRole('link', { name: 'Movies', exact: true }).first().click();
}

test('a title goes into several folders and shows in the watchlist at once', async ({ page }) => {
  await openWatchlist(page);
  await makeFolders(page, ['Tonight', 'Classics']);

  // Client-side, so the cached list is what the watchlist must not keep showing.
  await openMovies(page);
  await addButton(page).click();
  await folderBox(page, 'Tonight', 1).check();
  await folderBox(page, 'Classics', 1).check();
  await page.getByRole('button', { name: 'Add to watchlist' }).click();

  await expect(page.getByText(`${MOVIE} is in your watchlist`)).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(addButton(page)).toBeFocused();

  await addButton(page).click();
  await expect(folderBox(page, 'Tonight', 1)).toBeChecked();
  await page.getByRole('link', { name: 'Open watchlist' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Watchlist' })).toBeVisible();
  await expect(page.getByRole('link', { name: MOVIE })).toBeVisible();
  await selectFolder(page, 'Tonight', 1);
  await expect(page.getByRole('link', { name: MOVIE })).toBeVisible();
  await selectFolder(page, 'Classics', 1);
  await expect(page.getByRole('link', { name: MOVIE })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('link', { name: MOVIE })).toBeVisible();
});

test('a details page adds a title and shows its ticks on the next open', async ({ page }) => {
  await openWatchlist(page);
  await makeFolders(page, ['Tonight']);

  await page.goto(`/movies/${MOVIE_ID}`);
  const button = page.getByRole('button', { name: 'Add to watchlist', exact: true });
  await button.click();
  await folderBox(page, 'Tonight', 1).check();
  await page.getByRole('dialog').getByRole('button', { name: 'Add to watchlist' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(button).toBeFocused();

  await button.click();
  await expect(folderBox(page, 'Tonight', 1)).toBeChecked();
  await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
});

test('a person with no folders keeps the title under All titles', async ({ page }) => {
  await openWatchlist(page);
  await openMovies(page);
  await addButton(page).click();
  await expect(page.getByText(/No folders yet/)).toBeVisible();
  await page.getByRole('button', { name: 'Add to watchlist' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.goBack();
  await expect(page.getByRole('link', { name: MOVIE })).toBeVisible();
});

test('saving folders leaves the status and addedAt of a title alone', async ({ page, request }) => {
  await openWatchlist(page);
  const [keepId, addId] = await makeFolders(page, ['Keep', 'Add']);
  const uid = await getUid(page);
  const addedAt = '2020-01-02T03:04:05Z';
  await seedTitle(request, uid, MOVIE_ID, MOVIE, [keepId, 'from-another-tab'], {
    status: 'watched',
    addedAt,
  });

  await page.goto('/movies');
  await addButton(page).click();
  await expect(folderBox(page, 'Keep', 1)).toBeChecked();
  await folderBox(page, 'Add', 1).check();
  await folderBox(page, 'Keep', 1).uncheck();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  const saved = await readTitle(request, uid, `movie_${MOVIE_ID}`);
  expect(saved.status).toBe('watched');
  expect(new Date(saved.addedAt).getTime()).toBe(new Date(addedAt).getTime());
  expect(saved.folderIds.sort()).toEqual([addId, 'from-another-tab'].sort());
});

/** Holds a tab's commit until the returned function runs. */
async function holdCommit(page: Page) {
  let release = () => {};
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  let isHeld = false;
  await page.route(/documents:commit/, async (route) => {
    isHeld = true;
    await released;
    await route.continue();
  });
  return { release, isHeld: () => isHeld };
}

async function pickInOtherTab(page: Page, folder: string, submit: string) {
  const otherTab = await page.context().newPage();
  await mockTmdb(otherTab);
  await otherTab.goto('/movies');
  await addButton(otherTab).click();
  await folderBox(otherTab, folder, 1).check();
  await otherTab.getByRole('button', { name: submit }).click();
  await expect(otherTab.getByRole('dialog')).toHaveCount(0);
  await otherTab.close();
}

test('two tabs changing a stored title keep both folders', async ({ page, request }) => {
  await openWatchlist(page);
  const [firstId, secondId] = await makeFolders(page, ['First', 'Second']);
  const uid = await getUid(page);
  await seedTitle(request, uid, MOVIE_ID, MOVIE, []);
  await page.goto('/movies');

  const commit = await holdCommit(page);
  await addButton(page).click();
  await folderBox(page, 'First', 1).check();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect.poll(commit.isHeld).toBe(true);

  await pickInOtherTab(page, 'Second', 'Save');
  commit.release();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  const saved = await readTitle(request, uid, `movie_${MOVIE_ID}`);
  expect(saved.folderIds.sort()).toEqual([firstId, secondId].sort());
});

test('a tab that lost the race to create a title overwrites nothing and retries', async ({
  page,
  request,
}) => {
  await openWatchlist(page);
  const [firstId, secondId] = await makeFolders(page, ['First', 'Second']);
  const uid = await getUid(page);
  await page.goto('/movies');

  const commit = await holdCommit(page);
  await addButton(page).click();
  await folderBox(page, 'First', 1).check();
  await page.getByRole('button', { name: 'Add to watchlist' }).click();
  await expect.poll(commit.isHeld).toBe(true);

  await pickInOtherTab(page, 'Second', 'Add to watchlist');
  const { folderIds: winnerFolders, addedAt } = await readTitle(request, uid, `movie_${MOVIE_ID}`);
  expect(winnerFolders).toEqual([secondId]);

  await page.unroute(/documents:commit/);
  commit.release();
  await expect(page.getByText('Something went wrong. Please try again.')).toBeVisible();
  await expect(folderBox(page, 'First', 1)).toBeChecked();

  // The failure refreshed the list, so the same press is now an update.
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const saved = await readTitle(request, uid, `movie_${MOVIE_ID}`);
  expect(saved.addedAt).toBe(addedAt);
  expect(saved.folderIds.sort()).toEqual([firstId, secondId].sort());
});

test('a show on a catalog card is stored as TV', async ({ page, request }) => {
  await page.route('**/api/tmdb/trending/**', (route) =>
    route.fulfill({
      json: {
        page: 1,
        total_pages: 1,
        total_results: 1,
        results: [
          {
            id: 900,
            name: 'A show',
            overview: '',
            poster_path: null,
            backdrop_path: null,
            first_air_date: '2024-01-01',
            vote_average: 7,
            vote_count: 1,
            genre_ids: [],
            origin_country: [],
            media_type: 'tv',
          },
        ],
      },
    })
  );
  await openWatchlist(page);
  const uid = await getUid(page);
  await page.goto('/');
  await addButton(page, 'A show').click();
  await page.getByRole('button', { name: 'Add to watchlist' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  expect((await readTitle(request, uid, 'tv_900')).status).toBe('planned');
  await page.goto('/user/watchlist');
  await expect(page.getByText('A show')).toBeVisible();
});

test('a show on TV Shows is stored as TV', async ({ page, request }) => {
  await openWatchlist(page);
  const uid = await getUid(page);
  await page.goto('/tv');
  await addButton(page, 'Any show 1').click();
  await page.getByRole('button', { name: 'Add to watchlist' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  expect((await readTitle(request, uid, 'tv_100')).status).toBe('planned');
});

test('a signed-out visitor gets the offer with no Firebase, and comes back', async ({ page }) => {
  const chunks: string[] = [];
  page.on('request', (request) => {
    const { pathname } = new URL(request.url());
    if (/watchlist-store|index\.esm|watchlist-dialog/.test(pathname)) chunks.push(pathname);
  });

  await page.goto('/movies?genre=28');
  await expect(addButton(page, 'Action movie 1')).toBeVisible();
  expect(chunks).toEqual([]);

  await addButton(page, 'Action movie 1').click();
  await expect(page.getByRole('dialog', { name: 'Sign in to save Action movie 1' })).toBeVisible();
  expect(chunks.filter((path) => !path.includes('watchlist-dialog'))).toEqual([]);

  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(addButton(page, 'Action movie 1')).toBeFocused();

  await addButton(page, 'Action movie 1').click();
  // Scoped: the header has a link with this name too.
  await page.getByRole('dialog').getByRole('link', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
  await signIn(page);
  await expect(page).toHaveURL(/\/movies\?genre=28$/);
  await expect(addButton(page, 'Action movie 1')).toBeVisible();
});

test('a signed-in catalog page reads nothing until the picker opens', async ({ page }) => {
  await openWatchlist(page);
  const chunks: string[] = [];
  const firestore: string[] = [];
  const authorization: (string | undefined)[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (/watchlist-store|watchlist-dialog/.test(url.pathname)) chunks.push(url.pathname);
    if (url.port === '5012' && request.method() !== 'OPTIONS') {
      firestore.push(url.pathname);
      authorization.push(request.headers().authorization);
    }
  });

  await page.goto('/movies');
  await expect(addButton(page)).toBeVisible();
  expect(chunks).toEqual([]);
  expect(firestore).toEqual([]);

  await addButton(page).click();
  await page.getByRole('button', { name: 'Add to watchlist' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  const store = chunks.filter((path) => path.includes('watchlist-store'));
  expect(store.length).toBeGreaterThan(0);
  expect(store.every((path) => path.startsWith('/assets/'))).toBe(true);
  expect(authorization.length).toBeGreaterThan(0);
  expect(authorization.every((header) => header?.startsWith('Bearer '))).toBe(true);
});

test('the whole card opens the title and its button does not', async ({ page }) => {
  await page.goto('/movies');

  await addButton(page).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page).toHaveURL(/\/movies$/);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(addButton(page)).toBeFocused();

  const card = page.getByRole('listitem').filter({ hasText: MOVIE }).first();
  await card.hover();
  const box = await card.boundingBox();
  if (!box) throw new Error('No card');
  // The revealed title sits over the gradient, not under it.
  await expect(card.getByRole('heading', { name: MOVIE })).toBeVisible();
  const onTop = await card.getByRole('heading', { name: MOVIE }).evaluate((heading) => {
    const { x, y, height } = heading.getBoundingClientRect();
    const element = document.elementFromPoint(x + 4, y + height / 2);
    return element?.closest('a')?.getAttribute('href') ?? element?.tagName;
  });
  expect(onTop).toBe(`/movies/${MOVIE_ID}`);
  await page.mouse.click(box.x + 12, box.y + 12);
  await expect(page).toHaveURL(new RegExp(`/movies/${MOVIE_ID}$`));
});

test('the metadata of a card opens the title, hovered or not', async ({ page }) => {
  await page.goto('/movies');
  const card = page.getByRole('listitem').filter({ hasText: MOVIE }).first();
  const year = card.getByText('2024');
  await year.evaluate((element) => element.scrollIntoView({ block: 'center' }));
  // Invisible at rest, as on a phone, where a tap there must still reach the link.
  const getTarget = () =>
    year.evaluate((element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      const target = document.elementFromPoint(x + width / 2, y + height / 2);
      return target?.closest('a')?.getAttribute('href') ?? target?.tagName;
    });
  expect(await getTarget()).toBe(`/movies/${MOVIE_ID}`);

  await card.hover();
  await expect(year).toBeVisible();
  expect(await getTarget()).toBe(`/movies/${MOVIE_ID}`);
  const box = await year.boundingBox();
  if (!box) throw new Error('No year');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page).toHaveURL(new RegExp(`/movies/${MOVIE_ID}$`));
});

test('a second press outside the dialog leaves it open', async ({ page }) => {
  await page.goto('/movies');
  await addButton(page).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  const box = await addButton(page).boundingBox();
  if (!box) throw new Error('No button');
  await page.mouse.click(box.x + 10, box.y + 10);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.mouse.click(box.x + 10, box.y + 10);
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('a long list of folders scrolls and keeps the buttons on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await openWatchlist(page);
  await makeFolders(
    page,
    Array.from({ length: 12 }, (_, index) => `Folder ${index + 1}`)
  );
  await page.goto('/movies');
  await addButton(page).click();

  await expect(folderBox(page, 'Folder 1', 1)).toBeVisible();
  await folderBox(page, 'Folder 9', 1).scrollIntoViewIfNeeded();
  await folderBox(page, 'Folder 9', 1).check();
  await expect(page.getByRole('button', { name: 'Add to watchlist' })).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Add to watchlist' })).toBeEnabled();
  const hit = await page.getByRole('button', { name: 'Add to watchlist' }).evaluate((button) => {
    const { x, y, width, height } = button.getBoundingClientRect();
    return document.elementFromPoint(x + width / 2, y + height / 2) === button;
  });
  expect(hit).toBe(true);
});

test('a failed save shows a toast, keeps the ticks and is not slow', async ({ page }) => {
  await openWatchlist(page);
  await makeFolders(page, ['Offline']);
  await openMovies(page);
  await addButton(page).click();
  await folderBox(page, 'Offline', 1).check();

  await page.route(/documents:(commit|batchGet)/, (route) => route.abort());
  const start = Date.now();
  await page.getByRole('button', { name: 'Add to watchlist' }).click();
  await expect(page.getByText('Could not reach the server. Check your connection.')).toBeVisible({
    timeout: 20_000,
  });
  expect(Date.now() - start).toBeLessThan(4_000);
  await expect(folderBox(page, 'Offline', 1)).toBeChecked();
  await expect(page.getByRole('button', { name: 'Add to watchlist' })).toBeFocused();
});

test('the button shows progress while its dialog downloads, and one dialog opens', async ({
  page,
}) => {
  let release = () => {};
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/pages-mfe/assets/watchlist-dialog-*.js', async (route) => {
    await released;
    await route.continue();
  });
  await page.goto('/');

  await addButton(page, 'Row movie').click();
  await expect(addButton(page, 'Row movie').locator('svg.animate-spin')).toBeVisible();
  await addButton(page, 'Hero movie').click();
  release();
  await expect(page.getByRole('dialog', { name: 'Sign in to save Row movie' })).toBeVisible();
  await expect(page.locator('[data-slot="dialog-content"]')).toHaveCount(1);
});

test('a dialog chunk that will not load leaves the page working', async ({ page }) => {
  await page.route('**/pages-mfe/assets/watchlist-dialog-*.js', (route) => route.abort());
  await page.goto('/movies');

  // The first failure is the stale-deploy reload; the one after it reaches the button.
  await Promise.all([page.waitForEvent('load'), addButton(page).click()]);
  await addButton(page).click();

  await expect(
    page.getByText('The watchlist could not be opened. Reload the page and try again.')
  ).toBeVisible();
  await expect(page.getByRole('link', { name: MOVIE })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('a press with no network keeps the page and shows a toast', async ({ page, context }) => {
  await page.goto('/movies');
  await expect(addButton(page)).toBeVisible();

  await context.setOffline(true);
  await addButton(page).click();

  await expect(
    page.getByText('The watchlist could not be opened. Reload the page and try again.')
  ).toBeVisible();
  await expect(page.getByRole('link', { name: MOVIE })).toBeVisible();
  await expect(page).toHaveURL(/\/movies$/);
});

test('a folder deleted elsewhere is not written, and a retry saves the rest', async ({
  page,
  request,
}) => {
  await openWatchlist(page);
  const [goneId, keepId] = await makeFolders(page, ['Gone', 'Keep']);
  const uid = await getUid(page);
  await openMovies(page);
  await addButton(page).click();
  await folderBox(page, 'Gone', 1).check();
  await folderBox(page, 'Keep', 1).check();

  const deleted = await request.delete(`${FIRESTORE_DOCUMENTS}/users/${uid}/folders/${goneId}`, {
    headers: { Authorization: 'Bearer owner' },
  });
  expect(deleted.ok()).toBe(true);
  await page.getByRole('button', { name: 'Add to watchlist' }).click();

  await expect(page.getByText('Something went wrong. Please try again.')).toBeVisible();
  await expect(folderBox(page, 'Gone', 1)).toHaveCount(0);
  await expect(folderBox(page, 'Keep', 1)).toBeChecked();

  await page.getByRole('button', { name: 'Add to watchlist' }).click();
  await expect(page.getByText(`${MOVIE} is in your watchlist`)).toBeVisible();
  expect((await readTitle(request, uid, `movie_${MOVIE_ID}`)).folderIds).toEqual([keepId]);
});

test('Enter in the picker adds nothing, on a first open and a cached one', async ({
  page,
  request,
}) => {
  await openWatchlist(page);
  await makeFolders(page, ['Tonight']);
  const uid = await getUid(page);
  await page.goto('/movies');
  const dialog = page.getByRole('dialog');

  await addButton(page).focus();
  await page.keyboard.press('Enter');
  await expect(folderBox(page, 'Tonight', 1)).toBeVisible();
  await expect(dialog).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(addButton(page)).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(dialog).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(folderBox(page, 'Tonight', 1)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible();

  const stored = await request.get(`${FIRESTORE_DOCUMENTS}/users/${uid}/items/movie_${MOVIE_ID}`, {
    headers: { Authorization: 'Bearer owner' },
  });
  expect(stored.status()).toBe(404);
});

test('sign-out with the picker open turns it into the offer', async ({ page }) => {
  await openWatchlist(page);
  await openMovies(page);
  await addButton(page).click();
  await expect(page.getByRole('button', { name: 'Add to watchlist' })).toBeVisible();
  await page.evaluate(() => window.__CINEPULSE_STORE__?.getState().setUser(null));
  await expect(page.getByRole('dialog', { name: `Sign in to save ${MOVIE}` })).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('link', { name: 'Sign in' })).toBeVisible();
});

const CARDS = Array.from({ length: 24 }, (_, index) => `Card ${index + 1}`);

test('keyboard focus on the movies grid stays clear of the sticky filters', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.route('**/api/tmdb/discover/movie**', (route) =>
    route.fulfill({ json: paginated(CARDS) })
  );
  await page.goto('/movies');
  await page.getByRole('link', { name: 'Card 1', exact: true }).focus();

  for (const key of ['Tab', 'Shift+Tab']) {
    for (let stop = 0; stop < 30; stop += 1) {
      await page.keyboard.press(key);
      const [focusedTop, filtersBottom] = await page.evaluate(() => [
        document.activeElement?.getBoundingClientRect().top ?? 0,
        document.querySelector('.sticky')?.getBoundingClientRect().bottom ?? 0,
      ]);
      expect(focusedTop).toBeGreaterThanOrEqual(filtersBottom);
    }
  }
});

test('a card of a Home row stays on screen as focus moves back along it', async ({ page }) => {
  await page.route('**/api/tmdb/movie/*', (route) => route.fulfill({ json: paginated(CARDS) }));
  await page.goto('/');
  const row = page.getByRole('region', { name: 'Popular' });
  await addButton(row, 'Card 24').focus();

  for (let stop = 0; stop < 30; stop += 1) {
    await page.keyboard.press('Shift+Tab');
    const visibleShare = await page.evaluate(() => {
      const card = document.activeElement?.closest('li')?.getBoundingClientRect();
      const list = document.activeElement?.closest('ul')?.getBoundingClientRect();
      if (!card || !list) return 0;
      return (Math.min(card.right, list.right) - Math.max(card.left, list.left)) / card.width;
    });
    expect(visibleShare).toBeGreaterThan(0.5);
  }
});

test('closing the dialog leaves a row where it was', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.route('**/api/tmdb/movie/*', (route) => route.fulfill({ json: paginated(CARDS) }));
  await page.goto('/');
  const row = page.getByRole('region', { name: 'Popular' });

  await row.evaluate((element) => element.scrollIntoView({ block: 'center' }));

  // The last card the row shows whole, which its `scroll-px-*` counts as out of view. A raw press,
  // as `click()` would scroll the button first.
  const spot = await addButton(row, 'Card 6').boundingBox();
  if (!spot) throw new Error('No button');
  await page.mouse.click(spot.x + spot.width / 2, spot.y + spot.height / 2);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  await expect(addButton(row, 'Card 6')).toBeFocused();
  expect(await row.getByRole('list').evaluate((list) => list.scrollLeft)).toBe(0);
});

test('a long unbroken title stays inside the dialog on a phone', async ({ page, request }) => {
  const title = 'Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch';
  await page.setViewportSize({ width: 320, height: 640 });
  await page.route('**/api/tmdb/discover/movie**', (route) =>
    route.fulfill({ json: paginated([title]) })
  );
  await openWatchlist(page);
  await seedTitle(request, await getUid(page), MOVIE_ID, title, []);

  await page.goto('/movies');
  await addButton(page, title).click();
  await expect(page.getByText(`${title} is already in your watchlist.`)).toBeVisible();

  const dialog = page.getByRole('dialog');
  expect(await dialog.evaluate((element) => element.scrollWidth - element.clientWidth)).toBe(0);
});

test('a page lost with the connection loads on Try again once it returns', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await expect(addButton(page, 'Row movie')).toBeVisible();

  await context.setOffline(true);
  await openMovies(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeVisible();

  await context.setOffline(false);
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Movies' })).toBeVisible();
});

test.describe('on a touch screen', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test('a double tap on a card button opens the dialog and does nothing more', async ({ page }) => {
    await page.route('**/api/tmdb/discover/movie**', (route) =>
      route.fulfill({ json: paginated(CARDS) })
    );
    await openWatchlist(page);
    await makeFolders(page, ['Tonight', 'Classics', 'Later']);
    await page.goto('/movies');

    // Opened once, so the chunk is cached and the dialog is up before the second tap.
    const button = addButton(page, 'Card 9');
    await button.tap();
    const folder = folderBox(page, 'Classics', 1);
    const folderSpot = await folder.boundingBox();
    if (!folderSpot) throw new Error('No folder');
    await page.getByRole('button', { name: 'Close' }).tap();

    await button.evaluate(
      (element, y) => window.scrollBy(0, element.getBoundingClientRect().y - y),
      folderSpot.y
    );
    const spot = await button.boundingBox();
    if (!spot) throw new Error('No button');
    await page.touchscreen.tap(spot.x + spot.width / 2, spot.y + spot.height / 2);
    await page.waitForTimeout(120);
    await page.touchscreen.tap(spot.x + spot.width / 2, spot.y + spot.height / 2);

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(folder).not.toBeChecked();
    await expect(page).toHaveURL(/\/movies$/);

    await folder.tap();
    await expect(folder).toBeChecked();
  });
});

function statusBox(page: Page, title: string, status: string) {
  return page
    .getByRole('radiogroup', { name: `Status of ${title}` })
    .getByRole('radio', { name: status });
}

function filterPill(page: Page, name: string) {
  return page.getByRole('group', { name: 'Filter by status' }).getByRole('button', { name });
}

test('a status belongs to the title, in every folder and after a reload', async ({
  page,
  request,
}) => {
  await openWatchlist(page);
  const folderIds = await makeFolders(page, ['First', 'Second']);
  const uid = await getUid(page);
  await seedTitle(request, uid, MOVIE_ID, MOVIE, folderIds);
  await page.goto('/user/watchlist');

  await statusBox(page, MOVIE, 'Watched').click();
  await expect
    .poll(async () => (await readTitle(request, uid, `movie_${MOVIE_ID}`)).status)
    .toBe('watched');

  await selectFolder(page, 'First', 1);
  await expect(statusBox(page, MOVIE, 'Watched')).toBeChecked();
  await selectFolder(page, 'Second', 1);
  await expect(statusBox(page, MOVIE, 'Watched')).toBeChecked();
  await page.reload();
  await expect(statusBox(page, MOVIE, 'Watched')).toBeChecked();
  const stored = await readTitle(request, uid, `movie_${MOVIE_ID}`);
  expect(stored.folderIds.sort()).toEqual([...folderIds].sort());
});

test('the status filter survives a sign-in, a folder change, a reload and Back', async ({
  page,
  request,
}) => {
  await page.goto('/user/watchlist?status=watched');
  await signIn(page);
  await expect(page).toHaveURL(/status=watched/);
  await expect(filterPill(page, 'Watched')).toHaveAttribute('aria-pressed', 'true');

  const [folderId] = await makeFolders(page, ['Tonight']);
  const uid = await getUid(page);
  await seedTitle(request, uid, 1, 'Seen', [folderId], { status: 'watched' });
  await seedTitle(request, uid, 2, 'Unseen', [folderId]);
  await page.reload();

  await expect(page.getByText('Seen', { exact: true })).toBeVisible();
  await expect(page.getByText('Unseen')).toHaveCount(0);
  await folderLink(page, 'Tonight', 1).click();
  await expect(page).toHaveURL(/status=watched/);
  await expect(page).toHaveURL(/folder=/);
  await filterPill(page, 'Planned').click();
  await expect(page.getByText('Unseen')).toBeVisible();

  await page.goBack();
  await expect(page.getByText('Unseen')).toHaveCount(0);
  await expect(filterPill(page, 'Watched')).toHaveAttribute('aria-pressed', 'true');
});

test('the row controls open nothing, and the rest of the row opens the title', async ({
  page,
  request,
}) => {
  // Longer than the controls, or the row has no room past them for the link to reach.
  const title = 'A title long enough to run well past the status switch and the Remove button';
  await openWatchlist(page);
  const uid = await getUid(page);
  await seedTitle(request, uid, MOVIE_ID, title, []);
  await page.goto('/user/watchlist');

  const spot = await statusBox(page, title, 'Watched').boundingBox();
  if (!spot) throw new Error('No switch');
  await page.mouse.click(spot.x + spot.width / 2, spot.y + spot.height / 2);
  await expect(statusBox(page, title, 'Watched')).toBeChecked();
  await expect(page).toHaveURL(/\/user\/watchlist$/);

  const removeButton = page.getByRole('button', { name: `Remove ${title}` });
  const remove = await removeButton.boundingBox();
  if (!remove) throw new Error('No Remove');
  const middle = remove.y + remove.height / 2;
  // Between the controls: a near miss must not leave the page.
  await page.mouse.click(remove.x - 4, middle);
  await expect(page).toHaveURL(/\/user\/watchlist$/);
  // A disabled button lets a press through, as on the second press of a double one.
  await page.mouse.click(remove.x + remove.width / 2, middle);
  await expect(removeButton).toBeDisabled();
  await page.mouse.click(remove.x + remove.width / 2, middle);
  await expect(page).toHaveURL(/\/user\/watchlist$/);
  await page.getByRole('button', { name: 'Cancel' }).click();

  const pastControls = { x: remove.x + remove.width + 40, y: middle };
  await expectToCover(page.getByRole('link', { name: title }), pastControls);
  await click(page, pastControls);
  await expect(page).toHaveURL(new RegExp(`/movies/${MOVIE_ID}$`));
});

test('a correction during a slow write ends on the last press', async ({ page, request }) => {
  await openWatchlist(page);
  const uid = await getUid(page);
  await seedTitle(request, uid, MOVIE_ID, MOVIE, []);
  await page.goto('/user/watchlist');
  await expect(statusBox(page, MOVIE, 'Planned')).toBeChecked();

  let release = () => {};
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  let commits = 0;
  await page.route(/documents:commit/, async (route) => {
    commits += 1;
    if (commits === 1) await released;
    await route.continue();
  });

  await statusBox(page, MOVIE, 'Watched').click();
  await expect.poll(() => commits).toBe(1);
  await statusBox(page, MOVIE, 'Planned').click();
  await expect(statusBox(page, MOVIE, 'Planned')).toBeChecked();

  // The second write waits for the first, or it could land before it.
  await page.waitForTimeout(300);
  expect(commits).toBe(1);
  release();
  await expect.poll(() => commits).toBe(2);
  await expect(statusBox(page, MOVIE, 'Planned')).toBeChecked();
  await expect
    .poll(async () => (await readTitle(request, uid, `movie_${MOVIE_ID}`)).status)
    .toBe('planned');
});

test('a failed write puts the stored status back and keeps focus', async ({ page, request }) => {
  await openWatchlist(page);
  const uid = await getUid(page);
  await seedTitle(request, uid, MOVIE_ID, MOVIE, []);
  await page.goto('/user/watchlist');
  await expect(statusBox(page, MOVIE, 'Planned')).toBeChecked();

  await page.route(/documents:commit/, (route) => route.abort());
  await statusBox(page, MOVIE, 'Watched').click();

  await expect(page.getByText('Could not reach the server. Check your connection.')).toBeVisible();
  await expect(statusBox(page, MOVIE, 'Planned')).toBeChecked();
  await expect(statusBox(page, MOVIE, 'Watched')).toBeFocused();
});

test('the keyboard reaches the switch, and a row it changes keeps focus under a filter', async ({
  page,
  request,
}) => {
  await openWatchlist(page);
  const uid = await getUid(page);
  await seedTitle(request, uid, 1, 'First', []);
  await seedTitle(request, uid, 2, 'Second', []);
  await page.goto('/user/watchlist?status=planned');

  await statusBox(page, 'First', 'Planned').focus();
  await page.keyboard.press('ArrowRight');
  await expect(statusBox(page, 'First', 'Watched')).toBeFocused();
  await page.keyboard.press('Space');

  await expect(statusBox(page, 'First', 'Watched')).toBeChecked();
  await expect(statusBox(page, 'First', 'Watched')).toBeFocused();
  await expect(page.getByText('2 titles', { exact: true })).toBeVisible();
  await expect.poll(async () => (await readTitle(request, uid, 'movie_1')).status).toBe('watched');
  await expect(statusBox(page, 'First', 'Watched')).toBeFocused();
});

test('Back that takes away the focused row moves focus to the heading', async ({
  page,
  request,
}) => {
  await openWatchlist(page);
  const uid = await getUid(page);
  await seedTitle(request, uid, 1, 'Seen', [], { status: 'watched' });
  await seedTitle(request, uid, 2, 'Unseen', []);
  await page.goto('/user/watchlist?status=planned');
  await expect(page.getByText('Unseen')).toBeVisible();
  await filterPill(page, 'Watched').click();

  await statusBox(page, 'Seen', 'Watched').focus();
  await page.goBack();

  await expect(page.getByText('Unseen')).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'All titles' })).toBeFocused();
});

test.describe('in forced colours', () => {
  test.use({ forcedColors: 'active' });

  test('the chosen status and the chosen filter still stand out', async ({ page, request }) => {
    await openWatchlist(page);
    await seedTitle(request, await getUid(page), MOVIE_ID, MOVIE, []);
    await page.reload();
    const background = (control: Locator) =>
      control.evaluate((element) => getComputedStyle(element).backgroundColor);
    const chosen = statusBox(page, MOVIE, 'Planned');
    const track = page.getByRole('radiogroup', { name: `Status of ${MOVIE}` });

    expect(await background(chosen)).not.toBe(await background(track));
    expect(await background(filterPill(page, 'All'))).not.toBe(
      await background(filterPill(page, 'Planned'))
    );

    await statusBox(page, MOVIE, 'Watched').focus();
    await page.keyboard.press('ArrowLeft');
    await expect(chosen).toBeFocused();
    const ring = await chosen.evaluate((element) => {
      const { color, outlineColor, outlineOffset, outlineStyle } = getComputedStyle(element);
      return { onFill: outlineColor === color, outlineOffset, outlineStyle };
    });
    expect(ring).toEqual({ onFill: true, outlineOffset: '-4px', outlineStyle: 'solid' });
  });
});

function getLuminance(rgb: number[]): number {
  const [red, green, blue] = rgb.map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function getContrast(first: number[], second: number[]): number {
  const [lighter, darker] = [getLuminance(first), getLuminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * The lowest contrast between the pixels `near` and `far` px outside `target`, focused as by a
 * keyboard. Painted pixels, not styles: a ring on a gradient has no one colour to compute with.
 */
async function getRingContrast(page: Page, target: Locator, near: number, far: number) {
  // A key first: `focus()` shows the ring only to someone using the keyboard.
  await page.keyboard.press('Shift');
  await target.focus();
  // Focus alone can leave the target at the edge of the screen, with its ring past it.
  await target.evaluate((element) => element.scrollIntoView({ block: 'center' }));
  const box = await target.boundingBox();
  if (!box) throw new Error('No target');
  const { x, y, width, height } = box;
  const [middleX, middleY, right, bottom] = [x + width / 2, y + height / 2, x + width, y + height];
  const spots = [near, far].flatMap((distance) => [
    { x: middleX, y: y - distance },
    { x: middleX, y: bottom + distance - 1 },
    { x: x - distance, y: middleY },
    { x: right + distance - 1, y: middleY },
  ]);

  const screenshot = await page.screenshot({ animations: 'disabled' });
  const pixels = await page.evaluate(
    async ({ src, spots }) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      const canvas = new OffscreenCanvas(image.width, image.height);
      const context = canvas.getContext('2d');
      context?.drawImage(image, 0, 0);
      return spots.map(({ x, y }) =>
        Array.from(context?.getImageData(Math.round(x), Math.round(y), 1, 1).data ?? []).slice(0, 3)
      );
    },
    { src: `data:image/png;base64,${screenshot.toString('base64')}`, spots }
  );

  const sides = pixels.length / 2;
  return Math.min(
    ...pixels.slice(0, sides).map((pixel, side) => getContrast(pixel, pixels[sides + side]))
  );
}

function expectRingToStandOut(page: Page, target: Locator) {
  return expect(getRingContrast(page, target, 2, 6)).resolves.toBeGreaterThanOrEqual(3);
}

/** 9:1 between the ring and its band leaves one of them at 3:1 on any colour of an image. */
function expectTwoColoursOnImage(page: Page, target: Locator) {
  return expect(getRingContrast(page, target, 1, 4)).resolves.toBeGreaterThanOrEqual(9);
}

for (const theme of ['dark', 'light']) {
  test(`the focus ring of every Button variant stands out on the ${theme} theme`, async ({
    page,
    request,
  }) => {
    await page.addInitScript((value) => localStorage.setItem('cinepulse-theme', value), theme);
    await openWatchlist(page);
    await seedTitle(request, await getUid(page), MOVIE_ID, MOVIE, []);
    await page.reload();

    await expectRingToStandOut(page, page.getByRole('button', { name: 'New folder', exact: true }));
    await page.getByRole('button', { name: `Remove ${MOVIE}` }).click();
    await expectRingToStandOut(page, page.getByRole('button', { name: 'Remove title' }));
    await expectRingToStandOut(page, page.getByRole('button', { name: 'Cancel' }));

    await page.goto('/user/profile');
    await expectRingToStandOut(page, page.getByRole('link', { name: 'Open watchlist' }));

    await page.goto(`/movies/${FULL_MOVIE_ID}`);
    await expectRingToStandOut(page, page.getByRole('button', { name: 'Add to watchlist' }));

    await page.goto('/');
    await expectRingToStandOut(page, page.getByRole('link', { name: /^More Info/ }));
    await expectTwoColoursOnImage(page, addButton(page, 'Row movie'));
    await page.evaluate(() => window.scrollTo(0, 0));
    // The header grows back at the top of a page, and a box read before then goes out of date.
    await expect(page.getByRole('banner')).toHaveCSS('padding-top', '20px');
    const header = page.getByRole('banner');
    await expectTwoColoursOnImage(page, header.getByRole('button', { name: 'Dark theme' }));
    await expectTwoColoursOnImage(page, header.getByRole('link', { name: 'Profile' }));
  });
}

test.describe('the status on a phone', () => {
  test.use({ hasTouch: true, viewport: { width: 320, height: 640 } });

  test('the row controls and the question fit', async ({ page, request }) => {
    const title = 'A title long enough to fill the whole width of a phone screen and more';
    await openWatchlist(page);
    await seedTitle(request, await getUid(page), MOVIE_ID, title, []);
    await page.reload();

    const remove = page.getByRole('button', { name: `Remove ${title}` });
    expect((await remove.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    await remove.click();
    await expect(page.getByRole('button', { name: 'Remove title' })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBe(0);
  });

  test('the retry on the profile is large enough to press', async ({ page }) => {
    await openWatchlist(page);
    await page.route(/:runQuery/, (route) => route.abort());

    await page.goto('/user/profile');

    const retry = page.getByRole('button', { name: 'Try again' });
    await expect(retry).toBeVisible({ timeout: 10_000 });
    expect((await retry.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  });

  test('a double tap under a filter leaves the next title alone', async ({ page, request }) => {
    await openWatchlist(page);
    const uid = await getUid(page);
    await seedTitle(request, uid, 1, 'Second', []);
    await seedTitle(request, uid, 2, 'First', [], {
      addedAt: new Date(Date.now() + 60_000).toISOString(),
    });
    await page.goto('/user/watchlist?status=planned');

    const spot = await statusBox(page, 'First', 'Watched').boundingBox();
    if (!spot) throw new Error('No switch');
    await page.touchscreen.tap(spot.x + spot.width / 2, spot.y + spot.height / 2);
    await page.waitForTimeout(120);
    await page.touchscreen.tap(spot.x + spot.width / 2, spot.y + spot.height / 2);

    await expect
      .poll(async () => (await readTitle(request, uid, 'movie_2')).status)
      .toBe('watched');
    await page.waitForTimeout(300);
    expect((await readTitle(request, uid, 'movie_1')).status).toBe('planned');
    await expect(statusBox(page, 'First', 'Watched')).toBeChecked();
  });

  test('the switch and the filter fit, with 44 px to press', async ({ page, request }) => {
    await openWatchlist(page);
    const uid = await getUid(page);
    await seedTitle(request, uid, MOVIE_ID, 'A title long enough to reach past the edge', []);
    await page.goto('/user/watchlist');

    const group = page.getByRole('radiogroup', { name: /^Status of / });
    const groupBox = await group.boundingBox();
    const radio = await group.getByRole('radio', { name: 'Watched' }).boundingBox();
    const pill = await filterPill(page, 'Watched').boundingBox();
    if (!groupBox || !radio || !pill) throw new Error('No control');

    expect(groupBox.x + groupBox.width).toBeLessThanOrEqual(320);
    expect(radio.height).toBeGreaterThanOrEqual(44);
    expect(pill.height).toBeGreaterThanOrEqual(44);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBe(0);
  });
});

test('the profile shows the account, counts the watchlist and leads to it', async ({
  page,
  request,
}) => {
  await openWatchlist(page);
  const [folderId] = await makeFolders(page, ['Tonight']);
  const uid = await getUid(page);
  await seedTitle(request, uid, 1, 'Seen', [folderId], { status: 'watched' });
  await seedTitle(request, uid, 2, 'Unseen', []);
  await seedTitle(request, uid, 3, 'Also unseen', []);

  await page.goto('/user/profile');
  await expect(page.getByText(/^Member since \w{3} \d{1,2}, \d{4}$/)).toBeVisible();
  const statOf = (label: string) => page.locator('dt', { hasText: label }).locator('+ dd');
  await expect(statOf('Titles')).toHaveText('3');
  await expect(statOf('Planned')).toHaveText('2');
  await expect(statOf('Watched')).toHaveText('1');
  await expect(statOf('Folders')).toHaveText('1');

  await page.getByRole('link', { name: 'Open watchlist' }).click();
  await expect(page.getByText('3 titles', { exact: true })).toBeVisible();
  await page.goBack();
  await page.getByRole('main').getByRole('link', { name: 'Settings' }).click();
  await expect(page).toHaveURL('/user/settings');
});

test('a failed read of the watchlist leaves the account on the profile', async ({
  page,
  request,
}) => {
  await openWatchlist(page);
  await seedTitle(request, await getUid(page), 1, 'Seen', []);
  await page.route(/:runQuery/, (route) => route.abort());

  await page.goto('/user/profile');

  // A failed read is retried first.
  await expect(page.getByText('This section could not be loaded.')).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  await page.unroute(/:runQuery/);
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('dt', { hasText: 'Titles' }).locator('+ dd')).toHaveText('1');
});

test('a removed title leaves every folder and the profile', async ({ page, request }) => {
  await openWatchlist(page);
  const [folderId] = await makeFolders(page, ['Tonight']);
  const uid = await getUid(page);
  await seedTitle(request, uid, MOVIE_ID, MOVIE, [folderId]);
  await seedTitle(request, uid, 2, 'Stays', [folderId]);
  await page.goto('/user/watchlist');

  await page.getByRole('button', { name: `Remove ${MOVIE}` }).click();
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.getByRole('button', { name: 'Remove title' }).click();

  await expect(page.getByRole('link', { name: MOVIE })).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 2, name: 'All titles' })).toBeFocused();
  const stored = `${FIRESTORE_DOCUMENTS}/users/${uid}/items/movie_${MOVIE_ID}`;
  const headers = { Authorization: 'Bearer owner' };
  await expect.poll(async () => (await request.get(stored, { headers })).status()).toBe(404);
  await selectFolder(page, 'Tonight', 1);
  await expect(page.getByText('1 title', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('1 title', { exact: true })).toBeVisible();

  await page.goto('/user/profile');
  await expect(page.locator('dt', { hasText: 'Titles' }).locator('+ dd')).toHaveText('1');
});

test('the second press of a double press on Remove title lands on nothing', async ({
  page,
  request,
}) => {
  await openWatchlist(page);
  const uid = await getUid(page);
  for (let id = 1; id <= 4; id += 1) await seedTitle(request, uid, id, `Row ${id}`, []);
  await page.reload();
  const topRemove = page.getByRole('button', { name: /^Remove Row/ }).first();
  const label = await topRemove.getAttribute('aria-label');
  await topRemove.click();
  const confirm = await page.getByRole('button', { name: 'Remove title' }).boundingBox();
  if (!confirm) throw new Error('No Remove title');
  // Near its corner: once the rows move up, the Watched segment of another title lies here.
  const spot = { x: confirm.x + confirm.width - 6, y: confirm.y + confirm.height - 4 };

  await page.mouse.click(spot.x, spot.y);
  await page.waitForFunction((name) => !document.querySelector(`[aria-label="${name}"]`), label);
  await page.mouse.click(spot.x, spot.y);

  // The rows moved up under that point, and the press reaches none of them.
  await page.waitForTimeout(100);
  await expect(page).toHaveURL(/\/user\/watchlist$/);
  await expect(page.getByRole('radio', { name: 'Planned', checked: true })).toHaveCount(3);
  await expect(page.getByRole('heading', { level: 2, name: 'All titles' })).toBeFocused();

  // The hold passes: this waits for the switch to take a press.
  const next = page.getByRole('radiogroup').first().getByRole('radio', { name: 'Watched' });
  await next.click();
  await expect(next).toBeChecked();
});

test('a removal in a long list keeps the page where it is', async ({ page, request }) => {
  await openWatchlist(page);
  const uid = await getUid(page);
  for (let id = 1; id <= 24; id += 1) await seedTitle(request, uid, id, `Row ${id}`, []);
  await page.reload();
  const last = page.getByRole('button', { name: 'Remove Row 1', exact: true });
  await last.scrollIntoViewIfNeeded();
  await last.click();
  const scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY).toBeGreaterThan(300);

  await page.getByRole('button', { name: 'Remove title' }).click();

  await expect(page.getByRole('link', { name: 'Row 1', exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollY - 200);
});

type Spot = { x: number; y: number };
type Box = Spot & { width: number; height: number };

function tap(page: Page, { x, y }: Spot) {
  return page.touchscreen.tap(x, y);
}

function click(page: Page, { x, y }: Spot) {
  return page.mouse.click(x, y);
}

/** The middle of where two boxes overlap. */
function getOverlap(first: Box | null, second: Box | null): Spot {
  if (!first || !second) throw new Error('No box');
  const left = Math.max(first.x, second.x);
  const right = Math.min(first.x + first.width, second.x + second.width);
  const top = Math.max(first.y, second.y);
  const bottom = Math.min(first.y + first.height, second.y + second.height);
  if (left >= right || top >= bottom) throw new Error('The boxes do not overlap');
  return { x: (left + right) / 2, y: (top + bottom) / 2 };
}

/**
 * Polled, as a hold hides `under` from this check. It also waits the hold out: a `click()` that
 * meets one retries at other scroll positions, which would take the page off the boxes it read.
 */
function expectToCover(under: Locator, spot: Spot) {
  return expect
    .poll(() =>
      under.evaluate((element, { x, y }) => element.contains(document.elementFromPoint(x, y)), spot)
    )
    .toBe(true);
}

/** A folder with a title in it, and another folder for Move to offer. */
async function openFolderWithTitle(page: Page, request: APIRequestContext, name: string) {
  await openWatchlist(page);
  const [, folderId] = await makeFolders(page, ['Other', name]);
  await seedTitle(request, await getUid(page), 1, 'Row', [folderId]);
  await page.reload();
  await expect(page.getByRole('link', { name: 'Row', exact: true })).toBeVisible();
}

/**
 * Both presses go to one point of Cancel, which `under` covers once the form is gone. Checked
 * before pressing: a point that falls between two controls would pass on broken code.
 */
async function expectDoublePressToReachNothing(
  page: Page,
  form: string,
  under: Locator,
  press: typeof tap
) {
  const url = page.url();
  const toolbarButton = page.getByRole('button', { name: form, exact: true });
  const cancel = page.getByRole('button', { name: 'Cancel' });

  const underBox = await under.boundingBox();
  await toolbarButton.click();
  const spot = getOverlap(await cancel.boundingBox(), underBox);
  await cancel.click();
  await expectToCover(under, spot);

  await toolbarButton.click();
  await press(page, spot);
  await expect(cancel).toHaveCount(0);
  await page.waitForTimeout(120);
  await press(page, spot);

  await page.waitForTimeout(100);
  await expect(page).toHaveURL(url);
  await expect(cancel).toHaveCount(0);
  await expect(toolbarButton).toBeFocused();
  await expectToCover(under, spot);
}

for (const { input, press } of [
  { input: 'touch', press: tap },
  { input: 'mouse', press: click },
]) {
  test.describe(`a double press on Cancel by ${input}`, () => {
    test.use({ hasTouch: input === 'touch' });

    for (const form of ['New folder', 'New subfolder', 'Rename', 'Move', 'Delete']) {
      test(`in ${form} leaves the filter alone`, async ({ page, request }) => {
        await openFolderWithTitle(page, request, 'Keep');

        for (const width of [320, 430, 820]) {
          await page.setViewportSize({ width, height: 800 });
          await expectDoublePressToReachNothing(page, form, filterPill(page, 'Planned'), press);
        }

        // The hold passes: the same pill takes a press again.
        await filterPill(page, 'Planned').click();
        await expect(filterPill(page, 'Planned')).toHaveAttribute('aria-pressed', 'true');
      });
    }

    test('under a long folder name opens no title', async ({ page, request }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await openFolderWithTitle(page, request, 'x'.repeat(100));
      const link = page.getByRole('link', { name: 'Row', exact: true });

      // The question wraps here, and takes its Cancel down to the row.
      await expectDoublePressToReachNothing(page, 'Delete', link, press);
    });
  });
}

/** Rows from the top down: the list shows the latest first. */
async function openTitles(page: Page, request: APIRequestContext, titles: string[]) {
  await openWatchlist(page);
  const uid = await getUid(page);
  for (const [index, title] of titles.entries()) {
    const addedAt = new Date(Date.now() - index * 60_000).toISOString();
    await seedTitle(request, uid, index + 1, title, [], { addedAt });
  }
  await page.reload();
  await expect(page.getByRole('radiogroup')).toHaveCount(titles.length);
  return uid;
}

/**
 * Both presses go to one point of Cancel in the question of `title`, which `under` covers once the
 * question is gone. Checked before pressing, as with the folder forms below.
 */
async function expectDoublePressOnQuestionToReachNothing(
  page: Page,
  title: string,
  under: Locator,
  press: typeof tap
) {
  const remove = page.getByRole('button', { name: `Remove ${title}`, exact: true });
  const cancel = page.getByRole('button', { name: 'Cancel' });

  const underBox = await under.boundingBox();
  await remove.click();
  const spot = getOverlap(await cancel.boundingBox(), underBox);
  await cancel.click();
  await expectToCover(under, spot);

  await remove.click();
  await press(page, spot);
  await expect(cancel).toHaveCount(0);
  await page.waitForTimeout(120);
  await press(page, spot);

  await page.waitForTimeout(100);
  await expect(page).toHaveURL(/\/user\/watchlist$/);
  await expect(cancel).toHaveCount(0);
  await expect(remove).toBeFocused();
  await expectToCover(under, spot);
  return spot;
}

for (const { input, press } of [
  { input: 'touch', press: tap },
  { input: 'mouse', press: click },
]) {
  test.describe(`a double press on Cancel in the question by ${input}`, () => {
    test.use({ hasTouch: input === 'touch' });

    test('leaves the status of the next title alone', async ({ page, request }) => {
      const uid = await openTitles(page, request, ['First', 'Second']);

      for (const width of [320, 430, 820]) {
        await page.setViewportSize({ width, height: 800 });
        const watched = statusBox(page, 'Second', 'Watched');
        const spot = await expectDoublePressOnQuestionToReachNothing(page, 'First', watched, press);
        await expect(statusBox(page, 'Second', 'Planned')).toBeChecked();
        expect((await readTitle(request, uid, 'movie_2')).status).toBe('planned');

        // The hold passes: the same switch takes a press again.
        await press(page, spot);
        await expect(watched).toBeChecked();
        await statusBox(page, 'Second', 'Planned').click();
        await expect(statusBox(page, 'Second', 'Planned')).toBeChecked();
      }
    });

    test('under a long title opens no title', async ({ page, request }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      const long = 'x'.repeat(100);
      await openTitles(page, request, [long, 'Second', 'Third']);
      const link = page.getByRole('link', { name: 'Third', exact: true });

      // The question wraps here, and takes its Cancel down to the row after the next.
      await expectDoublePressOnQuestionToReachNothing(page, long, link, press);
    });
  });
}

test.describe('a double tap on Cancel', () => {
  test.use({ hasTouch: true });

  // With 44 px targets the toolbar wraps, and it comes back over the top of Cancel.
  for (const { width, button } of [
    { width: 320, button: 'Move' },
    { width: 390, button: 'Delete' },
    { width: 768, button: 'Delete' },
  ]) {
    test(`at ${width} px does not press ${button} in the toolbar`, async ({ page, request }) => {
      await page.setViewportSize({ width, height: 800 });
      await openFolderWithTitle(page, request, 'Keep');
      const under = page.getByRole('button', { name: button, exact: true });

      for (const form of ['New folder', 'Rename', 'Move']) {
        await expectDoublePressToReachNothing(page, form, under, tap);
      }
    });
  }
});
