import { type APIRequestContext, expect, type Page, test } from '@playwright/test';
import { signIn } from './sign-in';
import { mockTmdb } from './tmdb-mock';

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

/** No UI adds a title until CIN-26, so the emulator's admin access seeds it. */
async function seedTitle(
  request: APIRequestContext,
  uid: string,
  tmdbId: number,
  title: string,
  folderIds: string[]
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
          status: { stringValue: 'planned' },
          folderIds: { arrayValue: { values: folderIds.map((stringValue) => ({ stringValue })) } },
          addedAt: { timestampValue: new Date().toISOString() },
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
