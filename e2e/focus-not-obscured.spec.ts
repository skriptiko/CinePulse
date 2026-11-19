import { expect, type Page, test } from '@playwright/test';
import { FULL_MOVIE_ID, FULL_PERSON_ID, mockTmdb } from './tmdb-mock';

/** WCAG 2.2 SC 2.4.11 Focus Not Obscured (Minimum): no focused control sits under an overlay. */

type Box = { top: number; bottom: number; left: number; right: number };

test.beforeEach(async ({ page }) => {
  await mockTmdb(page);
});

async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
}

/**
 * Presses `key` until focus has left the page or come back to an element it saw, and returns the
 * box of each stop and of the overlay `overlaySelector`, read once the page stops scrolling.
 */
async function walk(page: Page, key: 'Tab' | 'Shift+Tab', overlaySelector: string) {
  const stops: { html: string; focus: Box; overlay: Box }[] = [];
  for (let stop = 0; stop < 400; stop++) {
    await page.keyboard.press(key);
    const result = await page.evaluate(async (selector) => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement) || element === document.body) return null;
      if (element.hasAttribute('data-seen')) return null;
      // A fixed control, such as the skip link, is an overlay itself and lies above the others.
      const isFixed = getComputedStyle(element).position === 'fixed';
      element.setAttribute('data-seen', '');
      // Waits two frames, so a scroll into view and the header's switch to glass have landed.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const overlay = document.querySelector(selector);
      const toBox = ({ top, bottom, left, right }: DOMRect) => ({ top, bottom, left, right });
      return {
        html: element.outerHTML.slice(0, 120),
        skip: isFixed || (overlay?.contains(element) ?? false),
        focus: toBox(element.getBoundingClientRect()),
        overlay: overlay ? toBox(overlay.getBoundingClientRect()) : null,
      };
    }, overlaySelector);
    if (result === null) break;
    if (!result.skip && result.overlay)
      stops.push({ html: result.html, focus: result.focus, overlay: result.overlay });
  }
  await page.evaluate(() =>
    document.querySelectorAll('[data-seen]').forEach((element) => {
      element.removeAttribute('data-seen');
    })
  );
  return stops;
}

function overlaps(a: Box, b: Box) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

for (const width of [1280, 375]) {
  test.describe(`at ${width} px`, () => {
    test.use({ viewport: { width, height: 720 } });

    for (const path of [`/movies/${FULL_MOVIE_ID}`, `/person/${FULL_PERSON_ID}`]) {
      test(`on ${path} the header covers no part of a focused control, down and back up`, async ({
        page,
      }) => {
        await page.goto(path);
        await settle(page);

        const down = await walk(page, 'Tab', 'header');
        const up = await walk(page, 'Shift+Tab', 'header');
        // The walks only prove something if they scroll.
        expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeGreaterThan(
          2 * 720
        );
        expect(up.length).toBeGreaterThan(10);

        for (const { html, focus, overlay } of [...down, ...up]) {
          expect(overlaps(focus, overlay), `${html} lies under the header`).toBe(false);
        }
      });
    }

    test('the offline banner covers no part of a focused control', async ({ page, context }) => {
      await page.goto(`/movies/${FULL_MOVIE_ID}`);
      await settle(page);
      await context.setOffline(true);
      const banner = page.getByText('You are offline. Showing saved results.');
      await expect(banner).toBeVisible();

      const stops = await walk(page, 'Tab', 'output > p');
      expect(stops.length).toBeGreaterThan(10);
      for (const { html, focus, overlay } of stops) {
        expect(overlaps(focus, overlay), `${html} lies under the offline banner`).toBe(false);
      }
    });
  });
}
