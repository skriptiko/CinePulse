import { expect, type Page, test } from '@playwright/test';
import { FULL_MOVIE_ID, mockTmdb, OTHER_FULL_MOVIE_ID } from './tmdb-mock';

type TransitionLog = { animated: string[] } | { skipped: string };

/**
 * Records each view transition the page starts: the pseudo-elements it animates once it is
 * ready, or why the browser skipped it. React adds animations of 0 ms of its own, which move
 * nothing, so only the ones that take time count.
 */
async function recordTransitions(page: Page) {
  await page.addInitScript(() => {
    const log: TransitionLog[] = [];
    Object.assign(window, { transitionLog: log });
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = (update) => {
      const transition = start(update);
      transition.ready.then(
        () =>
          log.push({
            animated: document
              .getAnimations()
              .map((animation) => animation.effect as KeyframeEffect | null)
              .filter((effect) => Number(effect?.getComputedTiming().duration) > 0)
              .map((effect) => effect?.pseudoElement ?? '')
              .filter((pseudo) => pseudo.startsWith('::view-transition')),
          }),
        (error: Error) => log.push({ skipped: error.name })
      );
      return transition;
    };
  });
  await mockTmdb(page);
}

function getTransitions(page: Page) {
  return page.evaluate(
    () => (window as unknown as { transitionLog: TransitionLog[] }).transitionLog
  );
}

/** The link of the first card in the main content. */
function firstCard(page: Page) {
  return page.getByRole('main').getByRole('heading', { level: 3 }).first().getByRole('link');
}

const POSTER_GROUP = '::view-transition-group(detail-poster)';

test('a card on Movies morphs its poster into the detail poster', async ({ page }) => {
  await recordTransitions(page);
  await page.goto('/movies');
  await firstCard(page).click();

  await expect(page).toHaveURL(/\/movies\/\d+$/);
  await expect
    .poll(() => getTransitions(page))
    .toContainEqual({
      animated: expect.arrayContaining([POSTER_GROUP]),
    });
  // Focus goes to the page, as it does with no transition.
  await expect(page.getByRole('main')).toBeFocused();
});

test('a card in More like this morphs into the next detail poster', async ({ page }) => {
  await recordTransitions(page);
  await page.goto(`/movies/${FULL_MOVIE_ID}`);
  const card = page
    .getByRole('region', { name: 'More like this' })
    .getByRole('link', { name: 'More 0' });
  await card.scrollIntoViewIfNeeded();
  await card.click();

  await expect(page).toHaveURL(new RegExp(`/movies/${OTHER_FULL_MOVIE_ID}$`));
  // The page's own poster gives up the name, so the browser does not skip the transition.
  await expect
    .poll(() => getTransitions(page))
    .toContainEqual({
      animated: expect.arrayContaining([POSTER_GROUP]),
    });
  expect(await getTransitions(page)).not.toContainEqual({ skipped: expect.any(String) });
});

test('a filter on Movies changes the grid with no transition', async ({ page }) => {
  await recordTransitions(page);
  await page.goto('/movies');
  await expect(firstCard(page)).toBeVisible();
  await page.getByRole('main').getByRole('button', { name: 'Action' }).click();

  await expect(page.getByRole('main').getByText('Action movie 1')).toBeVisible();
  expect(await getTransitions(page)).toEqual([]);
});

test('under reduced motion a card opens its page with nothing animated', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await recordTransitions(page);
  await page.goto('/movies');
  await firstCard(page).click();

  await expect(page).toHaveURL(/\/movies\/\d+$/);
  await expect.poll(async () => (await getTransitions(page)).length).toBeGreaterThan(0);
  for (const transition of await getTransitions(page)) {
    expect(transition).toEqual({ animated: [] });
  }
  await expect(page.getByRole('main')).toBeFocused();
});
