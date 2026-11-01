import { expect, type Locator, type Page, test } from '@playwright/test';
import { scrollToAndPress } from './scroll-to-and-press';
import {
  EMPTY_SHOW_ID,
  FULL_SHOW_ID,
  LONG_TEXT_SHOW_ID,
  mockTmdb,
  OTHER_FULL_SHOW_ID,
  UNKNOWN_SHOW_ID,
} from './tmdb-mock';

const SECTIONS = [
  'Where to watch',
  'Seasons',
  'Cast',
  'Videos and images',
  'More like this',
  'Reviews',
];

test.beforeEach(async ({ page }) => {
  await mockTmdb(page);
});

function section(page: Page, name: string): Locator {
  return page.getByRole('region', { name });
}

test('a card on TV Shows opens the show, also by direct URL', async ({ page }) => {
  await page.goto('/tv');

  await page.getByRole('link', { name: 'Any show 1' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Detail show' })).toBeVisible();
  await expect(page).toHaveURL(/\/tv\/\d+$/);
  await expect(page).toHaveTitle('Detail show · CinePulse');

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Detail show' })).toBeVisible();
});

test('TV Detail shows its six sections in order, below the hero', async ({ page }) => {
  await page.goto(`/tv/${FULL_SHOW_ID}`);

  await expect(page.getByRole('article').getByRole('heading', { level: 2 })).toHaveText(SECTIONS);
  await expect(page.getByText('3 seasons, 24 episodes')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add to watchlist' })).toBeVisible();
});

test('seasons keep their order, with the specials last', async ({ page }) => {
  await page.goto(`/tv/${FULL_SHOW_ID}`);

  const seasons = section(page, 'Seasons');
  await expect(seasons.getByRole('heading', { level: 3 })).toHaveText([
    'Season 1',
    'Season 2',
    'Season 3',
    'Specials',
  ]);
  await expect(seasons.getByRole('listitem').first()).toContainText('1 episode');
  await expect(seasons.getByRole('listitem').first()).not.toContainText('1 episodes');
  await expect(seasons.getByRole('listitem').first()).toContainText('It begins.');
});

test('the creator stands first in the line of directors and writers', async ({ page }) => {
  await page.goto(`/tv/${FULL_SHOW_ID}`);

  const line = section(page, 'Cast').getByRole('list', { name: 'Directors and writers' });
  await expect(line.getByRole('listitem').first()).toHaveText('Some Creator Creator');
  await expect(line.getByRole('link', { name: 'Some Creator' })).toHaveAttribute(
    'href',
    '/person/3000'
  );
});

test('a section with nothing to show keeps its heading and says so', async ({ page }) => {
  await page.goto(`/tv/${EMPTY_SHOW_ID}`);

  await expect(page.getByRole('article').getByRole('heading', { level: 2 })).toHaveText(SECTIONS);
  await expect(section(page, 'Where to watch')).toContainText('United States');
  await expect(section(page, 'Seasons')).toContainText('No seasons listed.');
  await expect(section(page, 'Cast')).toContainText('No cast listed yet.');
  await expect(section(page, 'Videos and images')).toContainText('No videos or images yet.');
  await expect(section(page, 'More like this')).toContainText('No similar titles yet.');
  await expect(section(page, 'Reviews')).toContainText('No reviews yet.');
});

test('an id TMDB does not know reaches NotFound', async ({ page }) => {
  await page.goto(`/tv/${UNKNOWN_SHOW_ID}`);

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('an id that is not a number reaches NotFound', async ({ page }) => {
  await page.goto('/tv/abc');

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('a failed request offers a retry', async ({ page }) => {
  await page.route(`**/api/tmdb/tv/${FULL_SHOW_ID}**`, (route) =>
    route.fulfill({ status: 500, json: {} })
  );
  await page.goto(`/tv/${FULL_SHOW_ID}`);

  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const [name, id] of [
    ['a full page', FULL_SHOW_ID],
    ['an empty page', EMPTY_SHOW_ID],
    ['long unbroken text', LONG_TEXT_SHOW_ID],
  ] as const) {
    test(`${name} does not widen the page`, async ({ page }) => {
      await page.goto(`/tv/${id}`);
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

  test('a card opens the other show at the top of the page', async ({ page }) => {
    await page.goto(`/tv/${FULL_SHOW_ID}`);

    await scrollToAndPress(
      page,
      section(page, 'More like this').getByRole('link', { name: 'More 0', exact: true })
    );

    await expect(page).toHaveURL(new RegExp(`/tv/${OTHER_FULL_SHOW_ID}$`));
    await expect(section(page, 'Reviews')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });
});
