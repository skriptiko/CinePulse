import { expect, type Locator, type Page, test } from '@playwright/test';
import {
  EMPTY_PERSON_ID,
  FULL_PERSON_ID,
  LONG_TEXT_QUERY,
  MAX_QUERY_LENGTH,
  mockTmdb,
  NOTHING_QUERY,
} from './tmdb-mock';

const TABS = ['Movies', 'TV Shows', 'People'];

test.beforeEach(async ({ page }) => {
  await mockTmdb(page);
});

function searchInput(page: Page): Locator {
  return page.getByRole('searchbox', { name: 'Search by title or name' });
}

function headerIcon(page: Page): Locator {
  return page.getByRole('banner').getByRole('link', { name: 'Search' });
}

function tab(page: Page, name: string): Locator {
  return page.getByRole('navigation', { name: 'Search results by type' }).getByRole('link', {
    name,
  });
}

/** The paths of the searches sent, such as `movie:dune`. */
function recordSearches(page: Page): string[] {
  const requests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith('/api/tmdb/search/')) {
      const type = url.pathname.replace('/api/tmdb/search/', '');
      requests.push(`${type}:${url.searchParams.get('query')}`);
    }
  });
  return requests;
}

/** The offline banner is a status region too, and an empty one. */
function resultCount(page: Page): Locator {
  return page.getByRole('status').filter({ hasText: 'found' });
}

function overflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
}

test.describe('the header icon', () => {
  test('opens a chunk that is new with the input in focus, ready for typing', async ({ page }) => {
    const opened = recordSearches(page);
    await page.goto('/');
    await expect(page.getByRole('region', { name: 'Popular' })).toBeVisible();

    // Slow enough that `AppLayout` has moved focus to `main` long before the page arrives.
    await page.route('**/pages-mfe/assets/search-page-*.js', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fallback();
    });
    await headerIcon(page).click();

    await expect(page.locator('main')).toBeFocused();
    await expect(searchInput(page)).toBeFocused();
    await expect(page).toHaveURL(/\/search$/);
    await expect(page).toHaveTitle('Search · CinePulse');

    await page.keyboard.type('dune');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Found: dune')).toBeVisible();
    expect(opened).toEqual(['movie:dune']);
  });

  test('opens a chunk already loaded with the input in focus', async ({ page }) => {
    await page.goto('/search');
    await expect(searchInput(page)).toBeFocused();
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Home' })
      .click();
    await expect(page.getByRole('region', { name: 'Popular' })).toBeVisible();

    await headerIcon(page).click();

    await expect(searchInput(page)).toBeFocused();
    await page.keyboard.type('dune');
    await expect(searchInput(page)).toHaveValue('dune');
  });

  test('on the open page, it drops the search and takes the input', async ({ page }) => {
    await page.goto('/search?q=dune&type=tv');
    await expect(page.getByText('Found: dune')).toBeVisible();

    await headerIcon(page).click();

    await expect(page).toHaveURL(/\/search$/);
    await expect(searchInput(page)).toHaveValue('');
    await expect(searchInput(page)).toBeFocused();
    await expect(page.getByText('What are you looking for?')).toBeVisible();
  });
});

test('with no query, it asks what to look for and sends nothing', async ({ page }) => {
  const requests = recordSearches(page);
  await page.goto('/search?type=person');

  await expect(page.getByText('What are you looking for?')).toBeVisible();
  await expect(tab(page, 'People')).toHaveAttribute('aria-current', 'page');
  expect(requests).toEqual([]);
});

test('a link can be shared, and survives a reload', async ({ page }) => {
  await page.goto('/search?q=dark&type=tv');

  await expect(page.getByText('Found: dark')).toBeVisible();
  await expect(searchInput(page)).toHaveValue('dark');
  await expect(searchInput(page)).not.toBeFocused();
  await expect(tab(page, 'TV Shows')).toHaveAttribute('aria-current', 'page');
  await expect(page).toHaveTitle('Search: dark · CinePulse');

  await page.reload();
  await expect(page.getByText('Found: dark')).toBeVisible();
});

test('searches on submit alone, and Back and Forward bring each search', async ({ page }) => {
  const requests = recordSearches(page);
  await page.goto('/search');

  await searchInput(page).fill('dune');
  await expect(page.getByText('Found: dune')).toHaveCount(0);
  expect(requests).toEqual([]);

  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByText('Found: dune')).toBeVisible();
  await expect(page).toHaveURL(/\?q=dune$/);

  await searchInput(page).fill('  dark  ');
  await searchInput(page).press('Enter');
  await expect(page.getByText('Found: dark')).toBeVisible();
  await expect(page).toHaveURL(/\?q=dark$/);
  expect(requests).toEqual(['movie:dune', 'movie:dark']);

  await page.goBack();
  await expect(page.getByText('Found: dune')).toBeVisible();
  await expect(searchInput(page)).toHaveValue('dune');

  await page.goForward();
  await expect(page.getByText('Found: dark')).toBeVisible();
  await expect(searchInput(page)).toHaveValue('dark');
});

test('an empty submit clears q and keeps the type', async ({ page }) => {
  await page.goto('/search?q=dune&type=person');
  await expect(page.getByRole('link', { name: /Found: dune/ })).toBeVisible();

  await searchInput(page).fill('');
  await searchInput(page).press('Enter');

  await expect(page.getByText('What are you looking for?')).toBeVisible();
  await expect(page).toHaveURL(/\/search\?type=person$/);
});

test('the tabs are links, and only the active one loads', async ({ page }) => {
  const requests = recordSearches(page);
  await page.goto('/search?q=dune');
  await expect(page.getByRole('link', { name: 'Found: dune' })).toBeVisible();

  await expect(
    page.getByRole('navigation', { name: 'Search results by type' }).getByRole('link')
  ).toHaveText(TABS);
  await expect(tab(page, 'Movies')).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('tab')).toHaveCount(0);

  await tab(page, 'TV Shows').click();
  await expect(page).toHaveURL(/\?q=dune&type=tv$/);
  await expect(tab(page, 'TV Shows')).toBeFocused();
  await expect(page.getByRole('link', { name: 'Found: dune' })).toHaveAttribute('href', /^\/tv\//);

  await tab(page, 'People').click();
  await expect(page).toHaveURL(/\?q=dune&type=person$/);
  await expect(page.getByRole('link', { name: /Found: dune/ })).toHaveAttribute(
    'href',
    `/person/${FULL_PERSON_ID}`
  );
  expect(requests).toEqual(['movie:dune', 'tv:dune', 'person:dune']);
});

test('a tab that loads shows the skeleton beside the form and the tabs', async ({ page }) => {
  await page.goto('/search?q=dune');
  await expect(page.getByRole('link', { name: 'Found: dune' })).toBeVisible();

  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/tmdb/search/tv**', async (route) => {
    await held;
    await route.fallback();
  });
  await tab(page, 'TV Shows').click();

  await expect(page.getByTestId('page-skeleton')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Found: dune' })).toHaveCount(0);
  await expect(searchInput(page)).toHaveValue('dune');
  await expect(tab(page, 'TV Shows')).toHaveAttribute('aria-current', 'page');

  release();
  await expect(page.getByRole('link', { name: 'Found: dune' })).toBeVisible();
  await expect(page.getByTestId('page-skeleton')).toHaveCount(0);
});

test.describe('every result leads to its details page', () => {
  test('a movie, with the watchlist on its card', async ({ page }) => {
    await page.goto('/search?q=dune');

    await page.getByRole('button', { name: 'Add Found: dune to your watchlist' }).click();
    await expect(page.getByRole('dialog', { name: 'Sign in to save Found: dune' })).toBeVisible();
    await page.keyboard.press('Escape');

    await page.getByRole('link', { name: 'Found: dune' }).click();
    await expect(page).toHaveURL(/\/movies\/100$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Detail movie' })).toBeVisible();
  });

  test('a show', async ({ page }) => {
    await page.goto('/search?q=dark&type=tv');

    await page.getByRole('link', { name: 'Found: dark' }).click();

    await expect(page).toHaveURL(/\/tv\/100$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Detail show' })).toBeVisible();
  });

  test('a person, with the photo under the enforced CSP', async ({ page }) => {
    const violations: string[] = [];
    page.on('console', (message) => {
      if (message.text().includes('Content Security Policy')) violations.push(message.text());
    });
    await page.goto('/search?q=some&type=person');

    const card = page.getByRole('link', { name: /Found: some/ });
    await expect(card).toContainText('Directing');
    await expect
      .poll(() => card.locator('img').evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0);
    expect(violations).toEqual([]);

    await card.click();

    await expect(page).toHaveURL(new RegExp(`/person/${FULL_PERSON_ID}$`));
    await expect(page.getByRole('heading', { level: 1, name: 'Some Person' })).toBeVisible();
  });
});

test('Load more adds the next page of a tab', async ({ page }) => {
  await page.goto('/search?q=dune&type=person');
  await expect(page.getByRole('link', { name: /Found: dune/ })).toHaveCount(1);

  await page.getByRole('button', { name: 'Load more' }).click();

  await expect(page.getByRole('link', { name: /Found: dune, page 2/ })).toHaveAttribute(
    'href',
    `/person/${EMPTY_PERSON_ID}`
  );
  await expect(page.getByRole('link', { name: /Found: dune/ })).toHaveCount(2);
  await expect(page.getByText("That's all")).toBeVisible();
});

test('a failed next page shows inline, with no toast', async ({ page }) => {
  await page.route('**/api/tmdb/search/person**', (route) =>
    route.request().url().includes('page=2') ? route.fulfill({ status: 500 }) : route.fallback()
  );
  await page.goto('/search?q=dune&type=person');

  await page.getByRole('button', { name: 'Load more' }).click();

  await expect(page.getByText("Couldn't load more people.")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('link', { name: /Found: dune/ })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(0);
});

test('nothing found names the query and the tab', async ({ page }) => {
  await page.goto(`/search?q=${NOTHING_QUERY}&type=tv`);

  await expect(
    page.getByRole('heading', { name: `No TV shows found for “${NOTHING_QUERY}”` })
  ).toBeVisible();

  await tab(page, 'People').click();
  await expect(
    page.getByRole('heading', { name: `No people found for “${NOTHING_QUERY}”` })
  ).toBeVisible();

  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(page).toHaveURL(/\/search\?type=person$/);
  await expect(searchInput(page)).toBeFocused();
});

test('a failed search offers a retry and leaves the form usable', async ({ page }) => {
  let isDown = true;
  await page.route('**/api/tmdb/search/movie**', (route) =>
    isDown ? route.fulfill({ status: 500 }) : route.fallback()
  );
  await page.goto('/search?q=dune');

  const retry = page.getByRole('button', { name: 'Try again' });
  await expect(retry).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('heading', { level: 1, name: 'Search' })).toBeVisible();

  await tab(page, 'TV Shows').click();
  await expect(page.getByRole('link', { name: 'Found: dune' })).toBeVisible();
  await tab(page, 'Movies').click();
  await expect(retry).toBeVisible({ timeout: 15_000 });

  isDown = false;
  await retry.click();

  await expect(page.getByRole('link', { name: 'Found: dune' })).toHaveAttribute(
    'href',
    /^\/movies\//
  );
});

test('a hand-typed q over the limit reaches the error, and a submit gets out', async ({ page }) => {
  const query = 'x'.repeat(MAX_QUERY_LENGTH + 1);
  await page.goto(`/search?q=${query}`);

  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Search' })).toBeVisible();
  await expect(searchInput(page)).toHaveValue(query);

  await page.getByRole('button', { name: 'Search', exact: true }).click();

  await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`\\?q=x{${MAX_QUERY_LENGTH}}$`));
});

test('the input stops at the limit', async ({ page }) => {
  await page.goto('/search');

  await searchInput(page).pressSequentially('x'.repeat(MAX_QUERY_LENGTH + 5), { delay: 0 });

  await expect(searchInput(page)).toHaveValue('x'.repeat(MAX_QUERY_LENGTH));
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  const LONG_QUERY = `${NOTHING_QUERY}${'x'.repeat(MAX_QUERY_LENGTH - NOTHING_QUERY.length)}`;

  test('the page with no query does not widen the page', async ({ page }) => {
    await page.goto('/search');

    await expect(searchInput(page)).toBeFocused();
    expect(await overflow(page)).toBe(0);
    await expect(tab(page, 'People')).toBeVisible();
  });

  for (const type of ['movie', 'tv', 'person']) {
    test(`a long unbroken query with no results stays inside, on ${type}`, async ({ page }) => {
      await page.goto(`/search?q=${LONG_QUERY}&type=${type}`);

      await expect(page.getByRole('heading', { name: /found for/ })).toBeVisible();
      expect(await overflow(page)).toBe(0);
    });

    test(`a long unbroken query with results stays inside, on ${type}`, async ({ page }) => {
      const query = 'y'.repeat(MAX_QUERY_LENGTH);
      await page.goto(`/search?q=${query}&type=${type}`);

      await expect(resultCount(page)).toBeVisible();
      expect(await overflow(page)).toBe(0);
    });

    test(`a very long name stays inside, on ${type}`, async ({ page }) => {
      await page.goto(`/search?q=${encodeURIComponent(LONG_TEXT_QUERY)}&type=${type}`);

      await expect(resultCount(page)).toBeVisible();
      await expect(page.getByRole('heading', { level: 3 }).first()).toContainText('xxx');
      expect(await overflow(page)).toBe(0);
    });
  }

  test('the error of a q over the limit stays inside', async ({ page }) => {
    await page.goto(`/search?q=${'x'.repeat(MAX_QUERY_LENGTH + 1)}`);

    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
    expect(await overflow(page)).toBe(0);
  });
});
