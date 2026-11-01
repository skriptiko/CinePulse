import type { Page, Route } from '@playwright/test';

const GENRES = [
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comedy' },
];

// Real TMDB names: TV genres are longer than movie ones, and the pills must still fit a phone.
const TV_GENRES = [
  { id: 18, name: 'Drama' },
  { id: 10759, name: 'Action & Adventure' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10768, name: 'War & Politics' },
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

function show(id: number, name: string) {
  return {
    id,
    name,
    overview: `${name} overview`,
    poster_path: null,
    backdrop_path: null,
    first_air_date: '2024-01-01',
    vote_average: 8,
    vote_count: 100,
    genre_ids: [18],
    origin_country: ['US'],
  };
}

export function paginated(titles: string[], page = 1) {
  return {
    page,
    results: titles.map((title, index) => movie(page * 100 + index, title)),
    total_pages: 2,
    total_results: titles.length * 2,
  };
}

function paginatedShows(names: string[], page = 1) {
  return {
    page,
    results: names.map((name, index) => show(page * 100 + index, name)),
    total_pages: 2,
    total_results: names.length * 2,
  };
}

function respond(route: Route, url: URL) {
  const path = url.pathname.replace('/api/tmdb', '');
  const page = Number(url.searchParams.get('page') ?? 1);

  if (path === '/genre/movie/list') return route.fulfill({ json: { genres: GENRES } });
  if (path === '/genre/tv/list') return route.fulfill({ json: { genres: TV_GENRES } });
  if (path === '/search/movie') {
    return route.fulfill({ json: paginated([`Found: ${url.searchParams.get('query')}`]) });
  }
  if (path === '/discover/movie') {
    const genre = url.searchParams.get('with_genres');
    const label = genre === '28' ? 'Action' : 'Any';
    return route.fulfill({ json: paginated([`${label} movie ${page}`], page) });
  }
  if (path === '/search/tv') {
    return route.fulfill({ json: paginatedShows([`Found: ${url.searchParams.get('query')}`]) });
  }
  if (path === '/discover/tv') {
    const label = url.searchParams.get('with_genres') === '18' ? 'Drama' : 'Any';
    return route.fulfill({ json: paginatedShows([`${label} show ${page}`], page) });
  }
  if (/^\/movie\/\d+$/.test(path)) {
    return route.fulfill({
      json: { ...movie(1, 'Detail movie'), genres: GENRES, runtime: 120, tagline: null },
    });
  }
  return route.fulfill({ json: paginated(['Row movie', 'Hero movie']) });
}

/** Answers every TMDB request from fixtures, so the tests need no token or network. */
export async function mockTmdb(page: Page): Promise<void> {
  await page.route('**/api/tmdb/**', (route) => respond(route, new URL(route.request().url())));
}
