import { expect, type Page, test } from '@playwright/test';
import { mockTmdb } from './tmdb-mock';

test.beforeEach(async ({ page }) => {
  await mockTmdb(page);
});

test('Home shows the hero and content rows', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('region', { name: 'Row movie' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Popular' })).toBeVisible();
});

test('a page downloads only the remote it needs', async ({ page }) => {
  const remoteRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/user-mfe/')) remoteRequests.push(request.url());
  });

  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Popular' })).toBeVisible();

  expect(remoteRequests).toEqual([]);
});

test('navigates across remotes', async ({ page }) => {
  await page.goto('/');

  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Movies' })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Movies' })).toBeVisible();
  await expect(page).toHaveTitle('Movies · CinePulse');

  await page.getByRole('banner').getByRole('link', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
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

test('TV Shows opens from the header and by direct URL', async ({ page }) => {
  await page.goto('/');

  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'TV Shows' })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'TV Shows' })).toBeVisible();
  await expect(page).toHaveTitle('TV Shows · CinePulse');
  await expect(page).toHaveURL(/\/tv$/);

  await page.reload();
  await expect(page.getByText('Any show 1')).toBeVisible();
});

test('TV Shows filters and search live in the URL and survive Back', async ({ page }) => {
  await page.goto('/tv');
  await expect(page.getByText('Any show 1')).toBeVisible();

  await page
    .getByRole('group', { name: 'Filter by genre' })
    .getByRole('button', { name: 'Drama' })
    .click();
  await expect(page.getByText('Drama show 1')).toBeVisible();
  await expect(page).toHaveURL(/genre=18/);

  await page.getByRole('button', { name: 'Load more' }).click();
  await expect(page.getByText('Drama show 2')).toBeVisible();

  await page.getByRole('button', { name: /^Sort by/ }).click();
  await page.getByRole('menuitemradio', { name: 'Newest' }).click();
  await expect(page).toHaveURL(/sort=newest/);

  await page.getByRole('searchbox', { name: 'Search TV shows' }).fill('dark');
  await expect(page.getByText('Found: dark')).toBeVisible();

  // Typing replaces the history entry, so Back undoes the sort step before it.
  await page.goBack();
  await expect(page.getByText('Drama show 1')).toBeVisible();
  await expect(page).not.toHaveURL(/sort=/);
  await expect(page).toHaveURL(/genre=18/);

  // A shared link opens the same view.
  await page.goto('/tv?genre=18&sort=rating');
  await expect(page.getByRole('button', { name: 'Sort by: Rating' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Drama', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

test('TV Shows shows its empty and error states', async ({ page }) => {
  await page.route('**/api/tmdb/search/tv**', (route) =>
    route.fulfill({ json: { page: 1, results: [], total_pages: 1, total_results: 0 } })
  );
  await page.goto('/tv?q=nothing');
  await expect(
    page.getByRole('heading', { name: 'No TV shows found for “nothing”' })
  ).toBeVisible();

  await page.route('**/api/tmdb/discover/tv**', (route) =>
    route.fulfill({ status: 500, json: {} })
  );
  await page.goto('/tv');
  // A 5xx is retried twice first.
  await expect(page.getByRole('alert')).toContainText('Something went wrong', { timeout: 10_000 });
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
});

test.describe('TV Shows at 320 px', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  async function expectNoHorizontalPageScroll(page: Page) {
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    // `wheel` does not wait for the scroll, so the position is read two frames later.
    await page.mouse.move(160, 600);
    await page.mouse.wheel(200, 0);
    await page.evaluate(
      () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    );
    expect(await page.evaluate(() => window.scrollX)).toBe(0);
  }

  test('the mobile menu opens TV Shows, which does not scroll sideways', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Menu' }).click();
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'TV Shows' })
      .click();

    await expect(page.getByText('Any show 1')).toBeVisible();
    await expectNoHorizontalPageScroll(page);
  });

  test('a long search with no results does not scroll sideways', async ({ page }) => {
    await page.route('**/api/tmdb/search/tv**', (route) =>
      route.fulfill({ json: { page: 1, results: [], total_pages: 1, total_results: 0 } })
    );
    const query = 'x'.repeat(100);

    await page.goto(`/tv?q=${query}`);

    await expect(page.getByRole('heading', { name: /^No TV shows found for/ })).toBeVisible();
    await expectNoHorizontalPageScroll(page);
  });
});

test('a card opens the details page, also by direct URL', async ({ page }) => {
  await page.goto('/movies');

  await page.getByRole('link', { name: /Any movie 1/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Detail movie' })).toBeVisible();
  await expect(page).toHaveURL(/\/movies\/\d+$/);

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Detail movie' })).toBeVisible();
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

test('a remote lost with the connection waits for it on Try again, and then loads', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Popular' })).toBeVisible();

  await context.setOffline(true);
  await page.getByRole('banner').getByRole('link', { name: 'Sign in' }).click();
  const unavailable = page.getByRole('heading', { name: 'This section is unavailable' });
  await expect(unavailable).toBeVisible();

  // A reload would land on chrome-error://chromewebdata/ soon after the press.
  await page.getByRole('button', { name: 'Try again' }).click();
  await page.waitForTimeout(1_000);
  await expect(unavailable).toBeVisible();

  await context.setOffline(false);
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
});

test('a chunk that keeps failing does not loop the page when sessionStorage is blocked', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', {
      get() {
        throw new DOMException('Access denied', 'SecurityError');
      },
    });
  });
  await page.route('**/pages-mfe/assets/movies-page-*.js', (route) => route.abort());
  let documentLoads = 0;
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documentLoads += 1;
  });

  await page.goto('/movies');
  await page.waitForTimeout(3_000);

  expect(documentLoads).toBe(1);
  await expect(page.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeVisible();
});

test('an unknown URL shows NotFound', async ({ page }) => {
  await page.goto('/no-such-page');

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page).toHaveTitle('Page not found · CinePulse');
});

test('the chosen theme applies before the app loads', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Dark theme' }).click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);

  // The app has to go first: a page chunk it is still loading would fail below, and the reload
  // of `vite:preloadError` would abort the navigation of this test.
  await page.goto('about:blank');

  // Without the app bundle only the blocking theme script can set the class.
  await page.route('**/assets/**', (route) => route.abort());
  await page.goto('/');

  await expect(page.locator('html')).not.toHaveClass(/dark/);
});
