import { expect, type Page, test } from '@playwright/test';
import { mockTmdb } from './tmdb-mock';

// The enforced CSP does not allow the local Auth emulator, which the demo project talks to.
test.use({ bypassCSP: true });

test.beforeEach(async ({ page }) => {
  await mockTmdb(page);
});

async function signIn(page: Page) {
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  const popup = await popupPromise;
  await popup.locator('#add-account-button').click();
  await popup.locator('#autogen-button').click();
  await popup.locator('#sign-in').click();
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
});

test('the session survives a reload and ends with sign-out', async ({ page }) => {
  await page.goto('/auth/login');
  await signIn(page);
  await expect(page.getByRole('heading', { level: 1, name: 'User Profile' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'User Profile' })).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
  await expect(page.getByRole('banner').getByRole('link', { name: 'Sign in' })).toBeVisible();
});
