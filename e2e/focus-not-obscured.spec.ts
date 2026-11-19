import { expect, type Page, test } from '@playwright/test';
import { FULL_MOVIE_ID, FULL_PERSON_ID, mockTmdb, paginated, paginatedShows } from './tmdb-mock';

/** WCAG 2.2 SC 2.4.11 Focus Not Obscured (Minimum): no focused control sits under an overlay. */

type Box = { top: number; bottom: number; left: number; right: number };
type Stop = { html: string; name: string; focus: Box; overlays: { selector: string; box: Box }[] };

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
 * box of each stop and of each overlay in `overlaySelectors`, read once the page stops scrolling.
 * A stop inside an overlay is left out: the overlay moves with it.
 */
async function walk(page: Page, key: 'Tab' | 'Shift+Tab', overlaySelectors: string[]) {
  const stops: Stop[] = [];
  for (let stop = 0; stop < 400; stop++) {
    await page.keyboard.press(key);
    const result = await page.evaluate(async (selectors) => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement) || element === document.body) return null;
      if (element.hasAttribute('data-seen')) return null;
      // A fixed control, such as the skip link, is an overlay itself and lies above the others.
      const isFixed = getComputedStyle(element).position === 'fixed';
      element.setAttribute('data-seen', '');
      // Waits two frames, so a scroll into view and the header's switch to glass have landed.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const toBox = ({ top, bottom, left, right }: DOMRect) => ({ top, bottom, left, right });
      const overlays = selectors.flatMap((selector) => {
        const overlay = document.querySelector(selector);
        return overlay ? [{ selector, overlay }] : [];
      });
      return {
        html: element.outerHTML.slice(0, 120),
        name: (element.getAttribute('aria-label') ?? element.textContent ?? '').trim(),
        skip: isFixed || overlays.some(({ overlay }) => overlay.contains(element)),
        focus: toBox(element.getBoundingClientRect()),
        overlays: overlays.map(({ selector, overlay }) => ({
          selector,
          box: toBox(overlay.getBoundingClientRect()),
        })),
      };
    }, overlaySelectors);
    if (result === null) break;
    if (!result.skip && result.overlays.length > 0)
      stops.push({
        html: result.html,
        name: result.name,
        focus: result.focus,
        overlays: result.overlays,
      });
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

        const down = await walk(page, 'Tab', ['header']);
        const up = await walk(page, 'Shift+Tab', ['header']);
        // The walks only prove something if they scroll.
        expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeGreaterThan(
          2 * 720
        );
        expect(up.length).toBeGreaterThan(10);

        for (const { html, focus, overlays } of [...down, ...up]) {
          for (const { box } of overlays) {
            expect(overlaps(focus, box), `${html} lies under the header`).toBe(false);
          }
        }
      });
    }

    for (const path of ['/movies', '/tv']) {
      test(`on ${path} the header and the sticky filters cover no part of a focused control, down and back up`, async ({
        page,
      }) => {
        // A full page of cards, so the grid scrolls under the sticky filters. These requests skip the
        // proxy check of `mockTmdb`, which other specs make on the same discover URLs.
        await page.route('**/api/tmdb/discover/**', (route) => {
          const url = new URL(route.request().url());
          const pageNumber = Number(url.searchParams.get('page') ?? 1);
          const titles = Array.from({ length: 20 }, (_, index) => `Title ${pageNumber}.${index}`);
          return route.fulfill({
            json: url.pathname.endsWith('/tv')
              ? paginatedShows(titles, pageNumber)
              : paginated(titles, pageNumber),
          });
        });
        await page.goto(path);
        await settle(page);
        await expect(page.getByRole('button', { name: 'Load more' })).toBeVisible();

        const overlaySelectors = ['header', 'div.sticky'];
        const down = await walk(page, 'Tab', overlaySelectors);
        const up = await walk(page, 'Shift+Tab', overlaySelectors);
        expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeGreaterThan(
          2 * 720
        );
        // Load more is the stop right after the footer on the way up, where the filters reach it.
        expect(up.some(({ name }) => name === 'Load more')).toBe(true);

        for (const { html, name, focus, overlays } of [...down, ...up]) {
          for (const { selector, box } of overlays) {
            expect(overlaps(focus, box), `${name}: ${html} lies under ${selector}`).toBe(false);
          }
        }
      });
    }

    test('the offline banner covers no part of a focused control', async ({ page, context }) => {
      await page.goto(`/movies/${FULL_MOVIE_ID}`);
      await settle(page);
      await context.setOffline(true);
      const banner = page.getByText('You are offline. Showing saved results.');
      await expect(banner).toBeVisible();

      const stops = await walk(page, 'Tab', ['output > p']);
      expect(stops.length).toBeGreaterThan(10);
      for (const { html, focus, overlays } of stops) {
        for (const { box } of overlays) {
          expect(overlaps(focus, box), `${html} lies under the offline banner`).toBe(false);
        }
      }
    });
  });
}
