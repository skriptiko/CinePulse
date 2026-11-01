import { expect, type Locator, type Page, test } from '@playwright/test';
import { press, scrollToAndPress } from './scroll-to-and-press';
import {
  EMPTY_PERSON_ID,
  FILMOGRAPHY_MOVIE_ID,
  FULL_MOVIE_ID,
  FULL_PERSON_ID,
  LONG_TEXT_PERSON_ID,
  mockTmdb,
  UNKNOWN_PERSON_ID,
} from './tmdb-mock';

const SECTIONS = ['Biography', 'Known for', 'Filmography'];

/** Forty titles, a talk show and a bare credit; the crew credit shares a row with a cast one. */
const FULL_ROW_COUNT = 42;

test.beforeEach(async ({ page }) => {
  await mockTmdb(page);
});

function section(page: Page, name: string): Locator {
  return page.getByRole('region', { name });
}

function filmographyRows(page: Page): Locator {
  return section(page, 'Filmography').getByRole('listitem');
}

function showAllButton(page: Page): Locator {
  return section(page, 'Filmography').getByRole('button', { name: /Show all/ });
}

function historyLength(page: Page): Promise<number> {
  return page.evaluate(() => window.history.length);
}

/** At once, as the wheel of `scrollToAndPress` takes too long this far down the page. */
async function bringToMiddle(target: Locator): Promise<number> {
  await target.evaluate((element) => {
    const { top, height } = element.getBoundingClientRect();
    window.scrollBy(0, top + height / 2 - window.innerHeight / 2);
  });
  return target.page().evaluate(() => window.scrollY);
}

/** A count and not a boolean, so a failure says how many. */
function countPastTheScreen(elements: Locator): Promise<number> {
  return elements.evaluateAll(
    (found) =>
      found.filter(
        (element) => element.getBoundingClientRect().right > document.documentElement.clientWidth
      ).length
  );
}

test('the page opens from the cast of a movie', async ({ page }) => {
  await page.goto(`/movies/${FULL_MOVIE_ID}`);

  await section(page, 'Cast').getByRole('link', { name: 'Some Director' }).click();

  await expect(page).toHaveURL(new RegExp(`/person/${FULL_PERSON_ID}$`));
  await expect(page.getByRole('heading', { level: 1, name: 'Some Person' })).toBeVisible();
  await expect(page).toHaveTitle('Some Person · CinePulse');
});

test('shows the facts and its sections in order', async ({ page }) => {
  await page.goto(`/person/${FULL_PERSON_ID}`);

  await expect(page.getByRole('article').getByRole('heading', { level: 2 })).toHaveText(SECTIONS);
  const article = page.getByRole('article');
  await expect(article.getByText('Directing', { exact: true })).toBeVisible();
  await expect(article.getByText('Feb 1, 1960')).toBeVisible();
  await expect(article.getByText('Mar 4, 2020')).toBeVisible();
  await expect(article.getByText('Kyiv, Ukraine')).toBeVisible();
});

test('the photo loads under the enforced CSP', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (message.text().includes('Content Security Policy')) violations.push(message.text());
  });
  await page.goto(`/person/${FULL_PERSON_ID}`);

  const photo = page.getByRole('article').locator('img').first();
  await expect
    .poll(() => photo.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);
  expect(violations).toEqual([]);
});

test('Known for stops at 12 and leaves the talk show out', async ({ page }) => {
  await page.goto(`/person/${FULL_PERSON_ID}`);

  const row = section(page, 'Known for');
  await expect(row.getByRole('heading', { level: 3 })).toHaveCount(12);
  await expect(row.getByRole('heading', { level: 3 }).first()).toHaveText('Series 39');
  await expect(row.getByText('Talk show')).toHaveCount(0);
  await expect(filmographyRows(page).first()).toContainText('Talk show');
});

test('a card opens its movie, and its button offers the watchlist', async ({ page }) => {
  await page.goto(`/person/${FULL_PERSON_ID}`);

  const row = section(page, 'Known for');
  await row.getByRole('button', { name: 'Add Film 38 to your watchlist' }).click();
  await expect(page.getByRole('dialog', { name: 'Sign in to save Film 38' })).toBeVisible();
  await page.keyboard.press('Escape');

  await row.getByRole('link', { name: 'Film 38' }).click();
  await expect(page).toHaveURL(/\/movies\/3038$/);
});

test('the filmography shows 30 rows, then all of them on a press', async ({ page }) => {
  await page.goto(`/person/${FULL_PERSON_ID}`);

  await expect(filmographyRows(page)).toHaveCount(30);

  await section(page, 'Filmography')
    .getByRole('button', { name: `Show all ${FULL_ROW_COUNT} credits` })
    .click();

  await expect(filmographyRows(page)).toHaveCount(FULL_ROW_COUNT);
  await expect(filmographyRows(page).nth(30).getByRole('link')).toBeFocused();
  await expect(section(page, 'Filmography').getByRole('button')).toHaveCount(0);
});

test('a row merges the roles on one title, and links to its page', async ({ page }) => {
  await page.goto(`/person/${FULL_PERSON_ID}`);

  const series = filmographyRows(page).filter({ hasText: 'Series 39' });
  await expect(series).toContainText('2019');
  await expect(series).toContainText('Role 39, Director');
  await expect(series.getByRole('link')).toHaveAttribute('href', '/tv/3039');

  await section(page, 'Filmography').getByRole('link', { name: 'Film 38' }).click();
  await expect(page).toHaveURL(/\/movies\/3038$/);
});

test('a credit with no date, title or poster takes the last row', async ({ page }) => {
  await page.goto(`/person/${FULL_PERSON_ID}`);

  await section(page, 'Filmography')
    .getByRole('button', { name: /Show all/ })
    .click();

  await expect(filmographyRows(page).last()).toHaveText('Untitled');
});

test('a long biography opens and closes, and a short one has no toggle', async ({ page }) => {
  await page.goto(`/person/${FULL_PERSON_ID}`);

  const biography = section(page, 'Biography');
  const text = biography.locator('p');
  const clampedHeight = (await text.boundingBox())?.height ?? 0;

  await biography.getByRole('button', { name: 'Show more' }).click();
  await expect(biography.getByRole('button', { name: 'Show less' })).toBeFocused();
  expect((await text.boundingBox())?.height).toBeGreaterThan(clampedHeight);

  await biography.getByRole('button', { name: 'Show less' }).click();
  expect((await text.boundingBox())?.height).toBe(clampedHeight);

  await page.goto(`/person/${EMPTY_PERSON_ID}`);
  await expect(section(page, 'Biography').getByRole('button')).toHaveCount(0);
});

test('a person TMDB knows nothing about keeps every heading and says so', async ({ page }) => {
  await page.goto(`/person/${EMPTY_PERSON_ID}`);

  await expect(page.getByRole('article').getByRole('heading', { level: 2 })).toHaveText(SECTIONS);
  await expect(section(page, 'Biography')).toContainText('No biography yet.');
  await expect(section(page, 'Known for')).toContainText('No titles to show yet.');
  await expect(section(page, 'Filmography')).toContainText('No credits listed.');
});

test('an unknown id reaches NotFound', async ({ page }) => {
  await page.goto(`/person/${UNKNOWN_PERSON_ID}`);

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('an id that is not a positive integer reaches NotFound with no request', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/tmdb/person')) requests.push(request.url());
  });

  await page.goto('/person/abc');

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  expect(requests).toEqual([]);
});

test('a failed request offers a retry that brings the person', async ({ page }) => {
  let isDown = true;
  await page.route('**/api/tmdb/person/**', (route) =>
    isDown ? route.fulfill({ status: 500 }) : route.fallback()
  );
  await page.goto(`/person/${FULL_PERSON_ID}`);

  const retry = page.getByRole('button', { name: 'Try again' });
  await expect(retry).toBeVisible({ timeout: 15_000 });

  isDown = false;
  await retry.click();

  await expect(page.getByRole('heading', { level: 1, name: 'Some Person' })).toBeVisible();
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const [name, id] of [
    ['a full page', FULL_PERSON_ID],
    ['an empty page', EMPTY_PERSON_ID],
    ['long unbroken text', LONG_TEXT_PERSON_ID],
  ] as const) {
    test(`${name} does not widen the page, opened all the way`, async ({ page }) => {
      await page.goto(`/person/${id}`);
      await expect(section(page, 'Filmography')).toBeVisible();

      const showMore = section(page, 'Biography').getByRole('button', { name: 'Show more' });
      if (await showMore.isVisible()) await showMore.click();
      const showAll = section(page, 'Filmography').getByRole('button', { name: /Show all/ });
      if (await showAll.isVisible()) await showAll.click();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBe(0);
    });
  }

  test('every external string of the long page stays inside the screen', async ({ page }) => {
    await page.goto(`/person/${LONG_TEXT_PERSON_ID}`);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('x'.repeat(200));
    expect(await countPastTheScreen(page.getByRole('article').locator('h1, p, dd'))).toBe(0);
    expect(await countPastTheScreen(section(page, 'Filmography').getByRole('link'))).toBe(0);
  });
});

test.describe('from far down the page', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('a cast link opens the person at the top of the page', async ({ page }) => {
    await page.goto(`/movies/${FULL_MOVIE_ID}`);

    await scrollToAndPress(
      page,
      section(page, 'Cast').getByRole('link', { name: 'Some Director' })
    );

    await expect(page).toHaveURL(new RegExp(`/person/${FULL_PERSON_ID}$`));
    await expect(page.getByRole('heading', { level: 1, name: 'Some Person' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('a row opens its movie at the top of the page', async ({ page }) => {
    await page.goto(`/person/${FULL_PERSON_ID}`);

    await scrollToAndPress(
      page,
      section(page, 'Filmography').getByRole('link', { name: 'Film 14', exact: true })
    );

    await expect(page).toHaveURL(/\/movies\/3014$/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('Show all takes a press on the bottom edge and leaves the reader there', async ({
    page,
  }) => {
    await page.goto(`/person/${FULL_PERSON_ID}`);

    const showAll = section(page, 'Filmography').getByRole('button', { name: /Show all/ });
    await showAll.evaluate((button) => {
      window.scrollBy(0, button.getBoundingClientRect().bottom - window.innerHeight);
    });
    const scrolled = await page.evaluate(() => window.scrollY);

    await press(page, showAll);

    await expect(filmographyRows(page)).toHaveCount(FULL_ROW_COUNT);
    expect(scrolled).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrolled);
  });

  test('Show all adds no history entry and does not move the page', async ({ page }) => {
    await page.goto(`/person/${FULL_PERSON_ID}`);
    const entries = await historyLength(page);

    const scrolled = await bringToMiddle(showAllButton(page));
    await press(page, showAllButton(page));

    await expect(page).toHaveURL(new RegExp(`/person/${FULL_PERSON_ID}\\?credits=all$`));
    await expect(filmographyRows(page).nth(30).getByRole('link')).toBeFocused();
    expect(await historyLength(page)).toBe(entries);
    expect(scrolled).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrolled);
  });

  test('Back from a short title returns to the open list, at the same row', async ({ page }) => {
    await page.goto(`/movies/${FULL_MOVIE_ID}`);
    await section(page, 'Cast').getByRole('link', { name: 'Some Director' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Some Person' })).toBeVisible();

    await bringToMiddle(showAllButton(page));
    await press(page, showAllButton(page));
    await expect(filmographyRows(page)).toHaveCount(FULL_ROW_COUNT);

    const row = section(page, 'Filmography').getByRole('link', { name: 'Film 0', exact: true });
    const scrolled = await bringToMiddle(row);
    const top = (await row.boundingBox())?.y;
    await press(page, row);
    await expect(page).toHaveURL(/\/movies\/3000$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Detail movie' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    // The title must be shorter than where the reader was, or this proves nothing.
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThan(scrolled);

    await page.goBack();

    await expect(page).toHaveURL(new RegExp(`/person/${FULL_PERSON_ID}\\?credits=all$`));
    await expect(filmographyRows(page)).toHaveCount(FULL_ROW_COUNT);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrolled);
    expect((await row.boundingBox())?.y).toBe(top);
    await expect(filmographyRows(page).nth(30).getByRole('link')).not.toBeFocused();

    await page.goBack();

    await expect(page).toHaveURL(new RegExp(`/movies/${FULL_MOVIE_ID}$`));
  });

  test('a shared link opens the whole list at the top, with no focus on it', async ({ page }) => {
    await page.goto(`/person/${FULL_PERSON_ID}?credits=all`);

    await expect(filmographyRows(page)).toHaveCount(FULL_ROW_COUNT);
    await expect(filmographyRows(page).nth(30).getByRole('link')).not.toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('a person reached from the open list starts with the short one', async ({ page }) => {
    await page.goto(`/person/${FULL_PERSON_ID}?credits=all`);

    await section(page, 'Filmography').getByRole('link', { name: 'Film 2', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/movies/${FILMOGRAPHY_MOVIE_ID}$`));
    await section(page, 'Cast')
      .getByRole('link', { name: /Actor 0/ })
      .click();

    await expect(page).toHaveURL(/\/person\/1000$/);
    await expect(filmographyRows(page)).toHaveCount(30);
  });
});
