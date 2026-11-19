import { createRequire } from 'node:module';
import { expect, type Page, test } from '@playwright/test';
import { signIn } from './sign-in';
import { FULL_MOVIE_ID, FULL_PERSON_ID, FULL_SHOW_ID, mockTmdb } from './tmdb-mock';

// The enforced CSP does not allow the local Auth emulator, which the demo project talks to.
test.use({ bypassCSP: true });

const AXE_PATH = createRequire(__filename).resolve('axe-core/axe.min.js');

/** WCAG 2.2 A and AA, the target in the PRD. Unlike jsdom, a browser computes contrast and size. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const PUBLIC_PAGES = [
  { path: '/', heading: null },
  { path: '/movies', heading: 'Movies' },
  { path: `/movies/${FULL_MOVIE_ID}`, heading: null },
  { path: '/tv', heading: 'TV Shows' },
  { path: `/tv/${FULL_SHOW_ID}`, heading: null },
  { path: `/person/${FULL_PERSON_ID}`, heading: null },
  { path: '/search?q=star', heading: null },
  { path: '/no-such-page', heading: null },
  { path: '/auth/login', heading: 'Sign in' },
];

const ACCOUNT_PAGES = ['/user/profile', '/user/settings', '/user/watchlist'];

test.beforeEach(async ({ page }) => {
  await mockTmdb(page);
});

/** Waits until requests and the skeletons' fade are over, so axe sees the page a person reads. */
async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
}

async function expectNoViolations(page: Page) {
  await settle(page);
  await page.addScriptTag({ path: AXE_PATH });
  const violations = await page.evaluate(async (tags) => {
    const result = await window.axe.run(document, { runOnly: { type: 'tag', values: tags } });
    return result.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map(({ target, failureSummary }) => `${target.join(' ')}: ${failureSummary}`),
    }));
  }, WCAG_TAGS);

  expect(violations).toEqual([]);
}

/**
 * Tabs through the whole page. Every stop must be an element a person can see, and the last
 * tabbable element must be reached, so nothing on the way traps the focus.
 */
async function expectKeyboardWalk(page: Page) {
  await settle(page);
  const last = await page.evaluate(() => {
    const tabbable = [
      ...document.querySelectorAll<HTMLElement>(
        'a[href], button, input, select, textarea, summary, [tabindex]'
      ),
    ].filter(
      (element) =>
        element.tabIndex >= 0 &&
        !element.matches(':disabled') &&
        element.closest('[inert]') === null &&
        element.checkVisibility({ visibilityProperty: true })
    );
    const element = tabbable.at(-1);
    element?.setAttribute('data-last-tabbable', '');
    return element?.outerHTML.slice(0, 120) ?? null;
  });
  expect(last).not.toBeNull();

  for (let stop = 0; stop < 400; stop++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement) || element === document.body) return null;
      const box = element.getBoundingClientRect();
      return {
        html: element.outerHTML.slice(0, 120),
        isLast: element.hasAttribute('data-last-tabbable'),
        isVisible:
          box.width > 0 &&
          box.height > 0 &&
          element.checkVisibility({ opacityProperty: true, visibilityProperty: true }),
      };
    });

    expect(focused, `focus left the page before ${last}`).not.toBeNull();
    if (focused === null) return;
    expect(focused.isVisible, `${focused.html} takes focus unseen`).toBe(true);
    if (focused.isLast) return;
  }
  throw new Error(`Tab never reached ${last}`);
}

for (const theme of ['dark', 'light']) {
  test.describe(`on the ${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('cinepulse-theme', value), theme);
    });

    for (const { path, heading } of PUBLIC_PAGES) {
      test(`${path} has no WCAG A or AA violations`, async ({ page }) => {
        await page.goto(path);
        if (heading)
          await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
        await expectNoViolations(page);
      });
    }

    test('the account pages have no WCAG A or AA violations', async ({ page }) => {
      await page.goto('/auth/login');
      await signIn(page);
      await expect(page.getByRole('heading', { level: 1, name: 'User Profile' })).toBeVisible();

      for (const path of ACCOUNT_PAGES) {
        await page.goto(path);
        await expectNoViolations(page);
      }
    });
  });
}

for (const { path } of PUBLIC_PAGES) {
  test(`the keyboard reaches the end of ${path}, through visible stops`, async ({ page }) => {
    await page.goto(path);
    await expectKeyboardWalk(page);
  });
}

test('the keyboard reaches the end of the account pages, through visible stops', async ({
  page,
}) => {
  await page.goto('/auth/login');
  await signIn(page);
  await expect(page.getByRole('heading', { level: 1, name: 'User Profile' })).toBeVisible();

  for (const path of ACCOUNT_PAGES) {
    await page.goto(path);
    await expectKeyboardWalk(page);
  }
});

declare global {
  interface Window {
    axe: typeof import('axe-core');
  }
}
