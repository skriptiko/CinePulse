import { expect, type Locator, type Page, test } from '@playwright/test';
import {
  expectTwoColoursOnImage,
  getContrast,
  type Rgb,
  readPixels,
  readTextColour,
} from './painted-pixels';
import { mockTmdb } from './tmdb-mock';

/** The header with a mouse, and the rows inside it below the controls, from its bottom edge. */
const HEADER_HEIGHT_PX = 76;
const ROWS_BELOW_CONTROLS_PX = [1, 6, 12, 18];
const FLAT_PAGES = ['/movies', '/search', '/auth/login', '/no-such-page'];
const NAV_LINKS = ['Home', 'Movies', 'TV Shows'];
/** Home is the current page, so these two are the ones at rest. */
const INACTIVE_NAV_LINKS = ['Movies', 'TV Shows'];
/** Above the controls of the scrolled header, at any width. */
const BLANK_HEADER_SPOT = { x: 160, y: 4 };
/** The image that brings the surface of the scrolled header closest to its muted text. */
const WORST_IMAGE = { dark: 'white', light: 'black' } as const;
const TEXT_CONTRAST = 4.5;
const ICON_CONTRAST = 3;

function header(page: Page) {
  return page.getByRole('banner');
}

function expectSameColour(actual: Rgb | undefined, expected: Rgb | undefined) {
  if (!(actual && expected)) throw new Error('No pixel');
  expect(getContrast(actual, expected)).toBeLessThan(1.02);
}

/** Scrolls Home with a sheet of the worst image between the page and the header. */
async function scrollOverWorstImage(page: Page, image: string) {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /^More Info/ })).toBeVisible();

  await page.evaluate((background) => {
    const sheet = document.createElement('div');
    Object.assign(sheet.style, { position: 'fixed', inset: '0', zIndex: '49', background });
    document.body.append(sheet);
    window.scrollTo(0, 400);
  }, image);

  // The padding takes as long to settle as the surface does.
  await expect(header(page)).toHaveCSS('padding-top', '12px');
}

async function readHeaderSurface(page: Page) {
  const [surface] = await readPixels(page, [BLANK_HEADER_SPOT]);
  if (!surface) throw new Error('No pixel');
  return surface;
}

async function expectContrast(target: Locator, background: Rgb, minimum: number) {
  expect(getContrast(await readTextColour(target), background)).toBeGreaterThanOrEqual(minimum);
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

for (const theme of ['dark', 'light'] as const) {
  test.describe(`the scrolled header on the ${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('cinepulse-theme', value), theme);
      await mockTmdb(page);
    });

    test('its text and icons stand out from the worst image', async ({ page }) => {
      await scrollOverWorstImage(page, WORST_IMAGE[theme]);
      const surface = await readHeaderSurface(page);

      for (const name of INACTIVE_NAV_LINKS) {
        const link = header(page).getByRole('link', { name, exact: true });
        await expectContrast(link, surface, TEXT_CONTRAST);
      }
      const search = header(page).getByRole('link', { name: 'Search' });
      await expectContrast(search.locator('svg'), surface, ICON_CONTRAST);
      const toggle = header(page).getByRole('button', { name: 'Dark theme' });
      await expectContrast(toggle.locator('svg'), surface, ICON_CONTRAST);

      // This icon lies on a chip of its own, not on the surface. The chip fades along its diagonal,
      // so the spots next to the two ends of the glyph on that diagonal hold its extremes.
      const profileIcon = header(page).getByRole('link', { name: 'Sign in' }).locator('svg');
      const box = await profileIcon.boundingBox();
      if (!box) throw new Error('No target');
      const chip = await readPixels(page, [
        { x: box.x + 4, y: box.y + 1 },
        { x: box.x + 14, y: box.y + 15 },
      ]);
      for (const pixel of chip) await expectContrast(profileIcon, pixel, ICON_CONTRAST);
    });

    test.describe('at 320 px', () => {
      test.use({ viewport: { width: 320, height: 640 } });

      test('its open menu stands out from the worst image', async ({ page }) => {
        await scrollOverWorstImage(page, WORST_IMAGE[theme]);
        // By keyboard: a mouse left on the button would measure its hover colour.
        const menu = header(page).getByRole('button', { name: 'Menu' });
        await menu.press('Enter');
        await expect(menu).toHaveAttribute('aria-expanded', 'true');
        const surface = await readHeaderSurface(page);

        for (const name of INACTIVE_NAV_LINKS) {
          const link = header(page).getByRole('link', { name, exact: true });
          await expectContrast(link, surface, TEXT_CONTRAST);
        }
        await expectContrast(menu.locator('svg'), surface, ICON_CONTRAST);
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
