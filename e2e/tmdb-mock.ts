import type { Page, Route } from '@playwright/test';

const GENRES = [
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comedy' },
];

function movie(id: number, title: string) {
  return {
    id,
    title,
    overview: `${title} overview`,
    poster_path: null,
    backdrop_path: null,
    release_date: '2024-01-01',
    vote_average: 7.5,
    vote_count: 100,
    genre_ids: [28],
    media_type: 'movie',
  };
}

function paginated(titles: string[], page = 1) {
  return {
    page,
    results: titles.map((title, index) => movie(page * 100 + index, title)),
    total_pages: 2,
    total_results: titles.length * 2,
  };
}

function respond(route: Route, url: URL) {
  const path = url.pathname.replace('/api/tmdb', '');
  const page = Number(url.searchParams.get('page') ?? 1);

  if (path === '/genre/movie/list') return route.fulfill({ json: { genres: GENRES } });
  if (path === '/search/movie') {
    return route.fulfill({ json: paginated([`Found: ${url.searchParams.get('query')}`]) });
  }
  if (path === '/discover/movie') {
    const genre = url.searchParams.get('with_genres');
    const label = genre === '28' ? 'Action' : 'Any';
    return route.fulfill({ json: paginated([`${label} movie ${page}`], page) });
  }
  return route.fulfill({ json: paginated(['Row movie', 'Hero movie']) });
}

/** Answers every TMDB request from fixtures, so the tests need no token or network. */
export async function mockTmdb(page: Page): Promise<void> {
  await page.route('**/api/tmdb/**', (route) => respond(route, new URL(route.request().url())));
}
