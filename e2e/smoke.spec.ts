import { expect, test } from '@playwright/test';
import { mockTmdb } from './tmdb-mock';

test.beforeEach(async ({ page }) => {
  await mockTmdb(page);
});

test('Home shows the hero and content rows', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('region', { name: 'Row movie' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Popular' })).toBeVisible();
});

test('navigates across remotes', async ({ page }) => {
  await page.goto('/');

  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Movies' })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Movies' })).toBeVisible();
  await expect(page).toHaveTitle('Movies · CinePulse');

  await page.getByRole('banner').getByRole('link', { name: 'Profile' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'User Profile' })).toBeVisible();
});

test('Movies filters and search live in the URL and survive Back', async ({ page }) => {
  await page.goto('/movies');
  await expect(page.getByText('Any movie 1')).toBeVisible();

  await page
    .getByRole('group', { name: 'Filter by genre' })
    .getByRole('button', { name: 'Action' })
    .click();
  await expect(page.getByText('Action movie 1')).toBeVisible();
  await expect(page).toHaveURL(/genre=28/);

  await page.getByRole('button', { name: 'Load more' }).click();
  await expect(page.getByText('Action movie 2')).toBeVisible();

  await page.getByRole('searchbox', { name: 'Search movies' }).fill('dune');
  await expect(page.getByText('Found: dune')).toBeVisible();

  // Typing replaces the history entry, so Back undoes the genre step before it.
  await page.goBack();
  await expect(page.getByText('Any movie 1')).toBeVisible();
  await expect(page).not.toHaveURL(/genre=/);
});

test('a remote that fails to load leaves the rest of the app working', async ({ page }) => {
  await page.route('**/user-mfe/remoteEntry.js', (route) => route.abort());
  await page.goto('/user/profile');

  await expect(page.getByRole('heading', { name: 'This section is unavailable' })).toBeVisible();

  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Movies' })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Movies' })).toBeVisible();
});

test('an unknown URL shows NotFound', async ({ page }) => {
  await page.goto('/no-such-page');

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page).toHaveTitle('Page not found · CinePulse');
});
