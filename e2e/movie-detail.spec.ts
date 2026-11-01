import { expect, type Locator, type Page, test } from '@playwright/test';
import { scrollToAndPress } from './scroll-to-and-press';
import {
  EMPTY_MOVIE_ID,
  FULL_MOVIE_ID,
  LONG_TEXT_MOVIE_ID,
  mockTmdb,
  OTHER_FULL_MOVIE_ID,
} from './tmdb-mock';

const SECTIONS = ['Where to watch', 'Cast', 'Videos and images', 'More like this', 'Reviews'];

test.beforeEach(async ({ page }) => {
  await mockTmdb(page);
});

function section(page: Page, name: string): Locator {
  return page.getByRole('region', { name });
}

function moreLikeThisCard(page: Page, title: string): Locator {
  return section(page, 'More like this').getByRole('link', { name: title, exact: true });
}

test('Movie Detail shows its five sections in order, below the hero', async ({ page }) => {
  await page.goto(`/movies/${FULL_MOVIE_ID}`);

  await expect(page.getByRole('heading', { level: 1, name: 'Detail movie' })).toBeVisible();
  await expect(page.getByRole('article').getByRole('heading', { level: 2 })).toHaveText(SECTIONS);
});

test('every list stops at its limit', async ({ page }) => {
  await page.goto(`/movies/${FULL_MOVIE_ID}`);

  await expect(section(page, 'Cast').getByRole('link', { name: /Character/ })).toHaveCount(12);
  await expect(
    section(page, 'Videos and images').getByRole('list', { name: 'Images' }).getByRole('link')
  ).toHaveCount(12);
  await expect(section(page, 'More like this').getByRole('heading', { level: 3 })).toHaveCount(12);
});

test('thumbnails and logos load under the enforced CSP', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (message.text().includes('Content Security Policy')) violations.push(message.text());
  });
  await page.goto(`/movies/${FULL_MOVIE_ID}`);

  const media = section(page, 'Videos and images');
  const thumbnail = media.getByRole('link', { name: /Official trailer/ }).locator('img');
  await media.scrollIntoViewIfNeeded();
  await expect
    .poll(() => thumbnail.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);

  const logo = section(page, 'Where to watch').getByRole('listitem').first().locator('img');
  await expect
    .poll(() => logo.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);

  expect(violations).toEqual([]);
});

test('videos stay links, with no iframe', async ({ page }) => {
  await page.goto(`/movies/${FULL_MOVIE_ID}`);

  const video = section(page, 'Videos and images').getByRole('link', { name: /Official trailer/ });
  await expect(video).toHaveAttribute('href', 'https://www.youtube.com/watch?v=trailer-key');
  await expect(video).toHaveAttribute('target', '_blank');
  await expect(video).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(page.locator('iframe')).toHaveCount(0);
});

test('a section with nothing to show keeps its heading and says so', async ({ page }) => {
  await page.goto(`/movies/${EMPTY_MOVIE_ID}`);

  await expect(page.getByRole('article').getByRole('heading', { level: 2 })).toHaveText(SECTIONS);
  await expect(section(page, 'Where to watch')).toContainText('United States');
  await expect(section(page, 'Cast')).toContainText('No cast listed yet.');
  await expect(section(page, 'Videos and images')).toContainText('No videos or images yet.');
  await expect(section(page, 'More like this')).toContainText('No similar titles yet.');
  await expect(section(page, 'Reviews')).toContainText('No reviews yet.');
});

test.describe('in another country', () => {
  test.use({ locale: 'uk-UA' });

  test('shows the providers of the country in the browser language', async ({ page }) => {
    await page.goto(`/movies/${FULL_MOVIE_ID}`);

    const providers = section(page, 'Where to watch');
    await expect(providers.getByText('Megogo')).toBeVisible();
    await expect(providers.getByText('Netflix')).toHaveCount(0);
    await expect(providers.getByText('Streaming data by JustWatch')).toBeVisible();
  });

  test('names the country when it has no providers', async ({ page }) => {
    await page.goto(`/movies/${EMPTY_MOVIE_ID}`);

    await expect(section(page, 'Where to watch')).toContainText('Ukraine');
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const [name, id] of [
    ['a full page', FULL_MOVIE_ID],
    ['an empty page', EMPTY_MOVIE_ID],
    ['long unbroken text', LONG_TEXT_MOVIE_ID],
  ] as const) {
    test(`${name} does not widen the page`, async ({ page }) => {
      await page.goto(`/movies/${id}`);
      await expect(section(page, 'Reviews')).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBe(0);
    });
  }
});

test.describe('from far down the page', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('a card opens the other movie at the top of the page', async ({ page }) => {
    await page.goto(`/movies/${FULL_MOVIE_ID}`);

    await scrollToAndPress(page, moreLikeThisCard(page, 'More 0'));

    await expect(page).toHaveURL(new RegExp(`/movies/${OTHER_FULL_MOVIE_ID}$`));
    await expect(section(page, 'Reviews')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('a card of a movie already in the cache opens at the top too', async ({ page }) => {
    await page.goto(`/movies/${FULL_MOVIE_ID}`);
    await scrollToAndPress(page, moreLikeThisCard(page, 'More 0'));
    await expect(page).toHaveURL(new RegExp(`/movies/${OTHER_FULL_MOVIE_ID}$`));
    await expect(section(page, 'Reviews')).toBeVisible();

    // The way back is a new press, and this time nothing suspends to shorten the page.
    await scrollToAndPress(page, moreLikeThisCard(page, 'More 0'));

    await expect(page).toHaveURL(new RegExp(`/movies/${FULL_MOVIE_ID}$`));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('a footer link opens its page at the top', async ({ page }) => {
    await page.goto(`/movies/${FULL_MOVIE_ID}`);

    await scrollToAndPress(
      page,
      page.getByRole('contentinfo').getByRole('link', { name: 'Movies' })
    );

    await expect(page).toHaveURL(/\/movies$/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('Back returns to where the reader was', async ({ page }) => {
    await page.goto(`/movies/${FULL_MOVIE_ID}`);
    await scrollToAndPress(page, moreLikeThisCard(page, 'More 0'));
    await expect(page).toHaveURL(new RegExp(`/movies/${OTHER_FULL_MOVIE_ID}$`));
    await expect(section(page, 'Reviews')).toBeVisible();

    await page.goBack();

    await expect(page).toHaveURL(new RegExp(`/movies/${FULL_MOVIE_ID}$`));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });
});
