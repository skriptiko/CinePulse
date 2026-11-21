import { type APIRequestContext, type Download, expect, type Page, test } from '@playwright/test';
import { signIn } from './sign-in';
import { mockTmdb } from './tmdb-mock';

const PROJECT = 'demo-cinepulse';
const FIRESTORE_DOCUMENTS = `http://127.0.0.1:5012/v1/projects/${PROJECT}/databases/(default)/documents`;
const AUTH_LOOKUP = `http://127.0.0.1:5013/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:lookup`;
const OWNER = { Authorization: 'Bearer owner' };

// The enforced CSP does not allow the local emulators, which the demo project talks to.
test.use({ bypassCSP: true });

test.beforeEach(async ({ page }) => {
  await mockTmdb(page);
});

function getUid(page: Page): Promise<string> {
  return page.evaluate(() => window.__CINEPULSE_STORE__?.getState().user?.uid ?? '');
}

/** Admin access through the emulator: a title and a folder, as the watchlist would store them. */
async function seedWatchlist(request: APIRequestContext, uid: string) {
  const responses = await Promise.all([
    request.post(`${FIRESTORE_DOCUMENTS}/users/${uid}/items?documentId=movie_100`, {
      headers: OWNER,
      data: {
        fields: {
          mediaType: { stringValue: 'movie' },
          tmdbId: { integerValue: '100' },
          title: { stringValue: 'Dune' },
          posterPath: { nullValue: null },
          status: { stringValue: 'planned' },
          folderIds: { arrayValue: { values: [{ stringValue: 'f1' }] } },
          addedAt: { timestampValue: new Date().toISOString() },
        },
      },
    }),
    request.post(`${FIRESTORE_DOCUMENTS}/users/${uid}/folders?documentId=f1`, {
      headers: OWNER,
      data: {
        fields: {
          name: { stringValue: 'Horror nights' },
          parentId: { nullValue: null },
          depth: { integerValue: '1' },
          createdAt: { timestampValue: new Date().toISOString() },
        },
      },
    }),
  ]);
  for (const response of responses) expect(response.ok()).toBe(true);
}

async function countDocuments(request: APIRequestContext, uid: string): Promise<number> {
  const lists = await Promise.all(
    ['items', 'folders'].map(async (name) => {
      const response = await request.get(`${FIRESTORE_DOCUMENTS}/users/${uid}/${name}`, {
        headers: OWNER,
      });
      expect(response.ok()).toBe(true);
      return ((await response.json()).documents ?? []) as unknown[];
    })
  );
  return lists.flat().length;
}

async function accountExists(request: APIRequestContext, uid: string): Promise<boolean> {
  const response = await request.post(AUTH_LOOKUP, { headers: OWNER, data: { localId: [uid] } });
  expect(response.ok()).toBe(true);
  return ((await response.json()).users ?? []).length > 0;
}

async function openDeleteDialog(page: Page) {
  await page.goto('/user/settings');
  const email = await signIn(page);
  await expect(page.getByRole('heading', { level: 1, name: 'User Settings' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete account' }).click();
  await expect(page.getByRole('dialog', { name: 'Delete your account?' })).toBeVisible();
  return email;
}

/** The emulator's re-sign-in window lists the accounts it knows: the person picks their own. */
async function confirmInPopup(page: Page, email: string) {
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('dialog').getByRole('button', { name: 'Delete account' }).click();
  const popup = await popupPromise;
  await popup.getByText(email).click();
}

test('deletes the account and its watchlist from Settings, then confirms it', async ({
  page,
  request,
}) => {
  const email = await openDeleteDialog(page);
  const uid = await getUid(page);
  await seedWatchlist(request, uid);
  expect(await countDocuments(request, uid)).toBe(2);
  await expect(page.getByRole('dialog')).toBeFocused();

  await confirmInPopup(page, email);

  await expect(
    page.getByRole('heading', { level: 1, name: 'Your account is deleted' })
  ).toBeVisible();
  await expect(page).toHaveURL('/auth/login');
  await expect(page.getByRole('banner').getByRole('link', { name: 'Sign in' })).toBeVisible();
  expect(await countDocuments(request, uid)).toBe(0);
  expect(await accountExists(request, uid)).toBe(false);
});

test('keeps the account and its data when the Google window is closed', async ({
  page,
  request,
}) => {
  await openDeleteDialog(page);
  const uid = await getUid(page);
  await seedWatchlist(request, uid);

  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('dialog').getByRole('button', { name: 'Delete account' }).click();
  await (await popupPromise).close();

  // Firebase notices a closed window by polling, a few seconds later.
  await expect(
    page.getByRole('dialog').getByRole('button', { name: 'Delete account' })
  ).toBeEnabled({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('button', { name: 'Delete account' })).toBeFocused();
  expect(await countDocuments(request, uid)).toBe(2);
  expect(await accountExists(request, uid)).toBe(true);
});

test('downloads the watchlist as JSON and CSV before the account is deleted', async ({
  page,
  request,
}) => {
  await openDeleteDialog(page);
  const uid = await getUid(page);
  await seedWatchlist(request, uid);
  const dialog = page.getByRole('dialog');

  const jsonPromise = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Download JSON' }).click();
  const json = await jsonPromise;
  expect(json.suggestedFilename()).toMatch(/^cinepulse-watchlist-\d{4}-\d{2}-\d{2}\.json$/);
  const data = JSON.parse(await readDownload(json));
  expect(data.folders).toEqual([{ id: 'f1', name: 'Horror nights', folders: [] }]);
  expect(data.titles).toEqual([expect.objectContaining({ tmdbId: 100, title: 'Dune' })]);

  const csvPromise = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Download CSV' }).click();
  const csv = await readDownload(await csvPromise);
  expect(csv).toMatch(/^﻿title,media_type,tmdb_id,status,added_at,folders\r\n/);
  expect(csv).toMatch(/\r\nDune,movie,100,planned,[^,]+,Horror nights\r\n$/);

  await expect(dialog).toBeVisible();
  expect(await countDocuments(request, uid)).toBe(2);
});

async function readDownload(download: Download): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of await download.createReadStream()) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}
