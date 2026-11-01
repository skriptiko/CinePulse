import { expect, type Page, test } from '@playwright/test';
import { expectRefusal, mockTmdb } from './tmdb-mock';

test.beforeEach(async ({ page }) => {
  await mockTmdb(page);
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Popular' })).toBeVisible();
});

/** A request nobody asserts on, sent by a page that goes on working whatever the answer. */
function send(page: Page, url: string) {
  return page.evaluate(async (path) => {
    const response = await fetch(path);

    return {
      status: response.status,
      cacheControl: response.headers.get('cache-control'),
      body: await response.json(),
    };
  }, url);
}

test('a param the proxy does not allow fails the test', async ({ page }) => {
  test.fail();

  await send(page, '/api/tmdb/movie/popular?language=en');
});

test('a path the proxy does not allow fails the test', async ({ page }) => {
  test.fail();

  await send(page, '/api/tmdb/movie/latest');
});

test('saying so for one request leaves any other refusal to fail the test', async ({ page }) => {
  test.fail();
  expectRefusal(page, (url) => url.searchParams.has('language'));

  await send(page, '/api/tmdb/movie/popular?region=UA');
});

test('a refusal the test means to provoke gets the answer of the proxy', async ({ page }) => {
  expectRefusal(page, (url) => url.searchParams.has('language'));

  expect(await send(page, '/api/tmdb/movie/popular?language=en')).toEqual({
    status: 400,
    cacheControl: 'no-store',
    body: { error: 'Invalid query parameters' },
  });
});

test('a path the test means to provoke gets the answer of the proxy', async ({ page }) => {
  expectRefusal(page, (url) => url.pathname.endsWith('/latest'));

  expect(await send(page, '/api/tmdb/movie/latest')).toEqual({
    status: 404,
    cacheControl: 'no-store',
    body: { error: 'Not found' },
  });
});
