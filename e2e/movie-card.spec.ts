import { expect, type Locator, type Page, test } from '@playwright/test';
import { mockTmdb } from './tmdb-mock';

/** The title of the first card on Movies, and the row with its year and rating. */
async function openFirstCard(page: Page) {
  await mockTmdb(page);
  await page.goto('/movies');
  const card = page.getByRole('main').getByRole('heading', { level: 3 }).first();
  await expect(card).toBeAttached();
  const title = card.locator('span');
  const meta = card.locator('xpath=following-sibling::div[1]');
  return { title, meta };
}

function getOpacity(target: Locator) {
  return target.evaluate((element) => getComputedStyle(element).opacity);
}

test.describe('a card on a touch screen', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test('shows its title, year and rating at rest', async ({ page }) => {
    const { title, meta } = await openFirstCard(page);

    await expect.poll(() => getOpacity(title)).toBe('1');
    await expect.poll(() => getOpacity(meta)).toBe('1');
    await expect(title).toBeVisible();
    await expect(meta).toBeVisible();
  });
});

test.describe('a card under a mouse', () => {
  test('hides its title, year and rating at rest', async ({ page }) => {
    const { title, meta } = await openFirstCard(page);
    await page.mouse.move(0, 0);

    await expect.poll(() => getOpacity(title)).toBe('0');
    await expect.poll(() => getOpacity(meta)).toBe('0');
  });
});
