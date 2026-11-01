import { expect, type Locator, type Page } from '@playwright/test';

/** A real wheel and a real press: Playwright's `click()` would scroll the page by itself. */
export async function scrollToAndPress(page: Page, target: Locator): Promise<void> {
  await page.mouse.move(640, 300);
  await expect(async () => {
    await page.mouse.wheel(0, 200);
    expect(await target.evaluate(isInViewport)).toBe(true);
  }).toPass();

  await press(page, target);
}

export async function press(page: Page, target: Locator): Promise<void> {
  const box = await target.boundingBox();
  if (!box) throw new Error('No target');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

function isInViewport(element: Element): boolean {
  const { top, bottom } = element.getBoundingClientRect();
  return top >= 0 && bottom <= window.innerHeight;
}
