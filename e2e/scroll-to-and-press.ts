import { expect, type Locator, type Page } from '@playwright/test';

/** A real wheel and a real press: Playwright's `click()` would scroll the page by itself. */
export async function scrollToAndPress(page: Page, target: Locator): Promise<void> {
  await page.mouse.move(640, 300);
  await expect(async () => {
    await page.mouse.wheel(0, 200);
    await waitUntilStill(page);
    expect(await target.evaluate(isInViewport)).toBe(true);
  }).toPass();

  const box = await target.boundingBox();
  if (!box) throw new Error('No target');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

/** `mouse.wheel` returns before the page has moved, and a box read by then goes out of date. */
async function waitUntilStill(page: Page): Promise<void> {
  let lastScrollY: number | null = null;
  await expect
    .poll(async () => {
      const scrollY = await page.evaluate(() => window.scrollY);
      const isStill = scrollY === lastScrollY;
      lastScrollY = scrollY;
      return isStill;
    })
    .toBe(true);
}

function isInViewport(element: Element): boolean {
  const { top, bottom } = element.getBoundingClientRect();
  return top >= 0 && bottom <= window.innerHeight;
}
