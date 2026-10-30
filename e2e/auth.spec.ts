import { expect, type Page, test } from '@playwright/test';
import { signIn } from './sign-in';
import { mockTmdb } from './tmdb-mock';

// The enforced CSP does not allow the local Auth emulator, which the demo project talks to.
test.use({ bypassCSP: true });

test.beforeEach(async ({ page }) => {
  await mockTmdb(page);
});

async function expectBelowHeader(page: Page, name: string) {
  const heading = await page.getByRole('heading', { level: 1, name }).boundingBox();
  const header = await page.getByRole('banner').boundingBox();
  expect(heading?.y).toBeGreaterThanOrEqual((header?.y ?? 0) + (header?.height ?? 0));
}

test('an anonymous visitor does not download Firebase', async ({ page }) => {
  const configRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/__/firebase/')) configRequests.push(request.url());
  });

  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Popular' })).toBeVisible();

  expect(configRequests).toEqual([]);
});

test('a protected page leads through Google sign-in and back', async ({ page }) => {
  await page.goto('/user/settings');
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();

  await signIn(page);

  await expect(page).toHaveURL('/user/settings');
  await expect(page.getByRole('banner').getByRole('link', { name: 'Profile' })).toBeVisible();
  await expectBelowHeader(page, 'User Settings');
});

test('the session survives a reload and ends with sign-out', async ({ page }) => {
  await page.goto('/auth/login');
  await signIn(page);
  await expect(page.getByRole('heading', { level: 1, name: 'User Profile' })).toBeVisible();
  await expectBelowHeader(page, 'User Profile');

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'User Profile' })).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
  await expect(page.getByRole('banner').getByRole('link', { name: 'Sign in' })).toBeVisible();
});
