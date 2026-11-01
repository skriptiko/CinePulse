import { expect, type Locator, type Page, test } from '@playwright/test';
import { focusByKeyboard, readPixels } from './painted-pixels';
import { mockTmdb } from './tmdb-mock';

/** `focus-visible:ring-[3px]` of `buttonVariants`. */
const RING_WIDTH_PX = 3;
/** `sm`: from here the padding of the hero matches the overlap, so the pills touch the button. */
const SM_PX = 640;
const TRENDING = '**/api/tmdb/trending/**';

function moreInfo(page: Page) {
  return page.getByRole('link', { name: /^More Info/ });
}

function genrePills(page: Page) {
  return page.getByRole('navigation', { name: 'Browse by genre' });
}

async function getBox(target: Locator) {
  const box = await target.boundingBox();
  if (!box) throw new Error('No target');
  return box;
}

async function expectBelowHeader(target: Locator) {
  const header = await getBox(target.page().getByRole('banner'));

  expect((await getBox(target)).y).toBeGreaterThanOrEqual(header.y + header.height);
}

for (const width of [320, 375, 480, 639, SM_PX]) {
  test.describe(`Home at ${width} px`, () => {
    test.use({ viewport: { width, height: 720 } });

    test.beforeEach(async ({ page }) => {
      await mockTmdb(page);
      await page.goto('/');
      await expect(moreInfo(page)).toBeVisible();
      await expect(genrePills(page)).toBeVisible();
    });

    test('the genre pills leave More Info and its focus ring clear', async ({ page }) => {
      const button = await getBox(moreInfo(page));
      const pills = await getBox(genrePills(page));
      const clearance = width < SM_PX ? RING_WIDTH_PX : 0;

      expect(pills.y).toBeGreaterThanOrEqual(button.y + button.height + clearance);
    });

    test('the focus ring of More Info shows all the way round', async ({ page }) => {
      const pill = await getBox(page.getByRole('link', { name: 'All', exact: true }));
      const button = await focusByKeyboard(page, moreInfo(page));
      const [side, bottom] = await readPixels(page, [
        { x: button.x - 2, y: button.y + button.height / 2 },
        { x: Math.max(button.x, pill.x) + 8, y: button.y + button.height + 1 },
      ]);

      expect(bottom).toEqual(side);
    });

    test('a press on the bottom edge of More Info reaches it', async ({ page }) => {
      const button = await getBox(moreInfo(page));
      await page.mouse.click(button.x + button.width / 2, button.y + button.height - 1);

      await expect(page).toHaveURL(/\/movies\/\d+$/);
    });
  });
}

for (const width of [320, 1280]) {
  test.describe(`Home and the Header at ${width} px`, () => {
    test.use({ viewport: { width, height: 720 } });

    test.beforeEach(async ({ page }) => {
      await mockTmdb(page);
    });

    test('a hero starts at the top of the page, under the Header', async ({ page }) => {
      await page.goto('/');
      await expect(moreInfo(page)).toBeVisible();

      expect((await getBox(page.getByRole('region', { name: 'Row movie' }))).y).toBe(0);
    });

    test('the skeleton of the hero lies where the hero will', async ({ page }) => {
      await page.route(TRENDING, () => {});
      await page.goto('/');
      await expect(genrePills(page)).toBeVisible();

      expect((await getBox(page.getByTestId('page-skeleton').first())).y).toBe(0);
    });

    test('with nothing trending, the genre pills clear the Header', async ({ page }) => {
      await page.route(TRENDING, (route) =>
        route.fulfill({ json: { page: 1, results: [], total_pages: 1, total_results: 0 } })
      );
      await page.goto('/');
      await expect(genrePills(page)).toBeVisible();

      await expectBelowHeader(genrePills(page));
    });

    test('with trending failed, the message clears the Header and the genre pills', async ({
      page,
    }) => {
      await page.route(TRENDING, (route) => route.fulfill({ status: 500, json: {} }));
      await page.goto('/');
      const message = page.getByRole('alert').first();
      // It comes after the retries of the request.
      await expect(message).toBeVisible({ timeout: 15_000 });
      await expect(genrePills(page)).toBeVisible();

      await expectBelowHeader(message);
      await expectBelowHeader(genrePills(page));
      const { y, height } = await getBox(message);
      expect((await getBox(genrePills(page))).y).toBeGreaterThan(y + height);
    });
  });
}
