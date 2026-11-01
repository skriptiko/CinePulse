import { expect, type Page, test } from '@playwright/test';
import { expectTwoColoursOnImage, getContrast, type Rgb, readPixels } from './painted-pixels';
import { mockTmdb } from './tmdb-mock';

/** The header with a mouse, and the rows inside it below the controls, from its bottom edge. */
const HEADER_HEIGHT_PX = 76;
const ROWS_BELOW_CONTROLS_PX = [1, 6, 12, 18];
const FLAT_PAGES = ['/movies', '/search', '/auth/login', '/no-such-page'];
const NAV_LINKS = ['Home', 'Movies', 'TV Shows'];

function header(page: Page) {
  return page.getByRole('banner');
}

function expectSameColour(actual: Rgb | undefined, expected: Rgb | undefined) {
  if (!(actual && expected)) throw new Error('No pixel');
  expect(getContrast(actual, expected)).toBeLessThan(1.02);
}

for (const theme of ['dark', 'light']) {
  test.describe(`the transparent header on the ${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('cinepulse-theme', value), theme);
      await mockTmdb(page);
    });

    test('the focus of the Logo and the nav links shows two colours', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('region', { name: 'Popular' })).toBeVisible();

      await expectTwoColoursOnImage(page, header(page).getByRole('link', { name: /^CP/ }));
      for (const name of NAV_LINKS) {
        await expectTwoColoursOnImage(page, header(page).getByRole('link', { name, exact: true }));
      }
    });

    test('the controls lie on the page background over a hero', async ({ page }) => {
      const spots = [
        { x: 1278, y: 1 },
        { x: 1278, y: 40 },
      ];

      await page.goto('/no-such-page');
      await expect(page.locator('main').getByRole('heading').first()).toBeVisible();
      const [flatTop, flatControls] = await readPixels(page, spots);

      await page.goto('/');
      await expect(page.getByRole('link', { name: /^More Info/ })).toBeVisible();
      const [heroTop, heroControls] = await readPixels(page, spots);

      expectSameColour(heroTop, flatTop);
      expectSameColour(heroControls, flatControls);
    });

    for (const path of FLAT_PAGES) {
      test(`nothing shows behind the header on ${path}`, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator('main').getByRole('heading').first()).toBeVisible();

        const strip = ROWS_BELOW_CONTROLS_PX.flatMap((row) =>
          [2, 400, 640, 1277].map((x) => ({ x, y: HEADER_HEIGHT_PX - row }))
        );
        const [background, ...pixels] = await readPixels(page, [{ x: 2, y: 2 }, ...strip]);

        for (const pixel of pixels) expectSameColour(pixel, background);
      });
    }

    test.describe('at 320 px', () => {
      test.use({ viewport: { width: 320, height: 640 } });

      test('the focus of the Logo and the menu links shows two colours', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('link', { name: /^More Info/ })).toBeVisible();

        await expectTwoColoursOnImage(page, header(page).getByRole('link', { name: /^CP/ }));
        await header(page).getByRole('button', { name: 'Menu' }).click();
        for (const name of NAV_LINKS) {
          await expectTwoColoursOnImage(
            page,
            header(page).getByRole('link', { name, exact: true })
          );
        }
      });
    });
  });
}

test('the header takes a press on its controls, and its scrim takes none', async ({ page }) => {
  await mockTmdb(page);
  await page.goto('/');
  const toggle = header(page).getByRole('button', { name: 'Dark theme' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');

  const hit = await page.evaluate(
    (y) => document.elementFromPoint(640, y)?.tagName,
    HEADER_HEIGHT_PX - 1
  );
  expect(hit).toBe('HEADER');

  const box = await toggle.boundingBox();
  if (!box) throw new Error('No target');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height - 1);

  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
});
