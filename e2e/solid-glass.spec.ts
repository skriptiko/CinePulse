import { expect, type Locator, type Page, test } from '@playwright/test';
import { mockTmdb } from './tmdb-mock';

/** The scrolled Header (`glass-bar`) and the watchlist button on the first card (`glass`). */
async function openScrolledMovies(page: Page) {
  await mockTmdb(page);
  await page.goto('/movies');
  await expect(page.getByRole('main').getByRole('heading', { level: 3 }).first()).toBeAttached();
  await page.mouse.wheel(0, 400);
  const header = page.locator('header.glass-bar');
  await expect(header).toBeVisible();
  return { header, chip: page.locator('main .glass').first() };
}

function getGlass(target: Locator) {
  return target.evaluate((element) => {
    const style = getComputedStyle(element);
    // `surface-elevated` as the browser resolves it, to compare with the computed background.
    const probe = document.createElement('div');
    probe.style.background = 'var(--surface-elevated)';
    document.body.append(probe);
    const solid = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return {
      background: style.backgroundColor,
      solid,
      blur: style.backdropFilter,
      border: style.borderTopWidth,
    };
  });
}

test('glass is translucent and blurred by default', async ({ page }) => {
  const { header, chip } = await openScrolledMovies(page);

  for (const target of [header, chip]) {
    // The Header fades its background in, so wait for the transition to end.
    await expect.poll(async () => (await getGlass(target)).blur).toContain('blur');
    const glass = await getGlass(target);
    expect(glass.background).not.toBe(glass.solid);
  }
});

test('glass becomes solid surface-elevated under prefers-contrast: more', async ({ page }) => {
  await page.emulateMedia({ contrast: 'more' });
  const { header, chip } = await openScrolledMovies(page);

  for (const target of [header, chip]) {
    // The Header fades its background in, so wait for the transition to end.
    await expect
      .poll(async () => {
        const glass = await getGlass(target);
        return glass.background === glass.solid;
      })
      .toBe(true);
    const glass = await getGlass(target);
    expect(glass.blur).toBe('none');
    expect(glass.border).toBe('1px');
  }
});
