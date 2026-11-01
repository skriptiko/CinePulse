import { expect, type Locator, test } from '@playwright/test';
import {
  expectInsetRingToStandOut,
  expectRingToStandOut,
  expectTwoColoursOnImage,
  getEdgeContrast,
  getRingContrast,
} from './painted-pixels';
import { FULL_MOVIE_ID, mockTmdb } from './tmdb-mock';

test.beforeEach(async ({ page }) => {
  await mockTmdb(page);
});

/** Nothing in the app sets it yet, and neither `Input` nor `Button` takes it as a prop. */
function markInvalid(target: Locator) {
  return target.evaluate((element) => element.setAttribute('aria-invalid', 'true'));
}

function blur(target: Locator) {
  return target.evaluate((element) => {
    if (element instanceof HTMLElement) element.blur();
  });
}

for (const theme of ['dark', 'light']) {
  test.describe(`on the ${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('cinepulse-theme', value), theme);
    });

    test('the ring of an Input stands out', async ({ page }) => {
      await page.goto('/movies');
      await expectRingToStandOut(page, page.getByRole('searchbox'));

      await page.goto('/search');
      await expectRingToStandOut(page, page.getByRole('searchbox'));
    });

    test('the ring of an invalid control stands out', async ({ page }) => {
      await page.goto('/movies');
      const search = page.getByRole('searchbox');
      await markInvalid(search);
      await expectRingToStandOut(page, search);

      const sort = page.getByRole('button', { name: /^Sort by/ });
      await markInvalid(sort);
      await expectRingToStandOut(page, sort);
    });

    test('the ring of a pill and of a segment stays whole', async ({ page }) => {
      await page.goto('/movies');
      const genres = page.getByRole('group', { name: 'Filter by genre' });
      await expectInsetRingToStandOut(page, genres.getByRole('button', { name: 'All' }));
      await expectInsetRingToStandOut(page, genres.getByRole('button', { name: 'Action' }));
      const sizes = page.getByRole('radiogroup', { name: 'Card size' });
      await expectInsetRingToStandOut(page, sizes.getByRole('radio', { checked: true }));
      await expectInsetRingToStandOut(page, sizes.getByRole('radio', { checked: false }).first());

      await page.goto('/');
      const links = page.getByRole('navigation', { name: 'Browse by genre' });
      await expectInsetRingToStandOut(page, links.getByRole('link').first());
    });

    test('the ring of a card in a row stays whole', async ({ page }) => {
      await page.goto('/');
      const row = page.getByRole('region', { name: 'Popular' });
      const card = row.getByRole('listitem').first();
      const link = card.getByRole('link');
      await expect(getRingContrast(page, link, 2, 6, card)).resolves.toBeGreaterThanOrEqual(3);
    });

    test('the header links stand out on any image', async ({ page }) => {
      await page.goto('/');
      const banner = page.getByRole('banner');
      await expect(banner).toHaveCSS('padding-top', '20px');

      await expectTwoColoursOnImage(page, banner.getByRole('link', { name: 'CinePulse' }));
      await expectTwoColoursOnImage(page, banner.getByRole('link', { name: 'Movies' }));
      await expectTwoColoursOnImage(page, banner.getByRole('link', { name: 'Home' }));
      await expectTwoColoursOnImage(page, page.getByRole('link', { name: 'Skip to content' }));
    });
  });
}

test.describe('in forced colours', () => {
  test.use({ forcedColors: 'active' });

  /** 3 and 4 px out lie on the outline, which starts 2 px from the box and is 2 px wide. */
  async function expectOutlineOnlyOnFocus(target: Locator) {
    const page = target.page();
    await blur(target);
    expect(await getEdgeContrast(page, target, 3, 7)).toBeCloseTo(1);
    await expect(getRingContrast(page, target, 3, 7)).resolves.toBeGreaterThanOrEqual(3);
  }

  test('a focused control has an outline, and one at rest has none', async ({ page }) => {
    await page.goto('/movies');
    await expectOutlineOnlyOnFocus(page.getByRole('searchbox'));
    await expectOutlineOnlyOnFocus(page.getByRole('button', { name: /^Sort by/ }));
    await expectOutlineOnlyOnFocus(page.getByRole('button', { name: 'Load more' }));

    await page.goto(`/movies/${FULL_MOVIE_ID}`);
    await expectOutlineOnlyOnFocus(page.getByRole('button', { name: 'Add to watchlist' }));
  });

  test('a control whose fill is gone keeps a border at rest', async ({ page }) => {
    await page.goto('/movies');
    for (const target of [
      page.getByRole('searchbox'),
      page.getByRole('button', { name: /^Sort by/ }),
      page.getByRole('button', { name: 'Load more' }),
    ]) {
      await blur(target);
      await expect(getEdgeContrast(page, target, 0, 7)).resolves.toBeGreaterThanOrEqual(3);
    }

    await page.goto(`/movies/${FULL_MOVIE_ID}`);
    const add = page.getByRole('button', { name: 'Add to watchlist' });
    await expect(getEdgeContrast(page, add, 0, 7)).resolves.toBeGreaterThanOrEqual(3);
  });

  test('a menu item has an outline only while it is focused', async ({ page }) => {
    await page.goto('/movies');
    await page.getByRole('button', { name: /^Sort by/ }).click();
    const items = page.getByRole('menuitemradio');
    await expect(items.first()).toBeVisible();
    await page.keyboard.press('ArrowDown');
    const focused = page.locator('[role=menuitemradio]:focus');
    await expect(focused).toHaveCount(1);
    await expect(page.locator('[role=menuitemradio]:not(:focus)').first()).toHaveCSS(
      'outline-style',
      'none'
    );
    await expect(focused).toHaveCSS('outline-style', 'solid');
  });

  test('main has no outline, at rest or after a navigation by keyboard', async ({ page }) => {
    await page.goto('/');
    const main = page.getByRole('main');
    await expect(main).toHaveCSS('outline-style', 'none');

    await page.getByRole('banner').getByRole('link', { name: 'Movies' }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/movies$/);
    await expect(main).toBeFocused();
    await expect(main).toHaveCSS('outline-style', 'none');
  });

  test('a dialog has no outline, focused or with focus inside it', async ({ page }) => {
    await page.goto('/movies');
    await page.getByRole('button', { name: 'Add Any movie 1 to your watchlist' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeFocused();
    await expect(dialog).toHaveCSS('outline-style', 'none');

    await page.keyboard.press('Tab');
    await expect(dialog).not.toBeFocused();
    await expect(dialog).toHaveCSS('outline-style', 'none');
  });
});
