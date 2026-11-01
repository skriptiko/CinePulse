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

export function paginated(titles: string[], page = 1) {
  return {
    page,
    results: titles.map((title, index) => movie(page * 100 + index, title)),
    total_pages: 2,
    total_results: titles.length * 2,
  };
}

/** A movie with every section filled, and a second one to reach from its "More like this". */
export const FULL_MOVIE_ID = 7;
export const OTHER_FULL_MOVIE_ID = 8;
/** A movie whose sections all come back empty. */
export const EMPTY_MOVIE_ID = 9;
/** A movie whose every external string is one long word. */
export const LONG_TEXT_MOVIE_ID = 10;

const ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

function emptySections() {
  const none = { page: 1, results: [], total_pages: 1, total_results: 0 };

  return {
    credits: { cast: [], crew: [] },
    videos: { results: [] },
    images: { backdrops: [], posters: [], logos: [] },
    recommendations: none,
    similar: none,
    reviews: none,
    'watch/providers': { results: {} },
  };
}

function provider(id: number, name: string) {
  return { provider_id: id, provider_name: name, logo_path: `/provider-${id}.png` };
}

/** Enough of each list to reach its limit, or a phone's page width with `text`. */
function fullSections(otherMovieId: number, text = (value: string) => value) {
  const results = Array.from({ length: 14 }, (_, index) =>
    movie(otherMovieId + index * 100, `More ${index}`)
  );

  return {
    ...emptySections(),
    credits: {
      cast: Array.from({ length: 14 }, (_, index) => ({
        id: 1000 + index,
        credit_id: `cast-${index}`,
        name: text(`Actor ${index}`),
        character: text(`Character ${index}`),
        profile_path: `/actor-${index}.jpg`,
        order: index,
      })),
      crew: [
        {
          id: 2000,
          credit_id: 'crew-1',
          name: text('Some Director'),
          department: 'Directing',
          job: 'Director',
          profile_path: null,
        },
      ],
    },
    videos: {
      results: [
        {
          id: 'video-1',
          key: 'trailer-key',
          name: text('Official trailer'),
          site: 'YouTube',
          type: 'Trailer',
          official: true,
        },
      ],
    },
    images: {
      backdrops: Array.from({ length: 14 }, (_, index) => ({
        file_path: `/still-${index}.jpg`,
        width: 3840,
        height: 2160,
      })),
      posters: [],
      logos: [],
    },
    recommendations: { page: 1, results, total_pages: 1, total_results: results.length },
    reviews: {
      page: 1,
      results: [
        {
          id: 'review-1',
          author: text('A reviewer'),
          author_details: { rating: 8 },
          content: text('A long review.'),
          created_at: '2024-03-15T12:00:00.000Z',
          url: 'https://www.themoviedb.org/review/review-1',
        },
      ],
      total_pages: 1,
      total_results: 1,
    },
    'watch/providers': {
      results: {
        US: {
          link: `https://www.themoviedb.org/movie/${FULL_MOVIE_ID}/watch?locale=US`,
          flatrate: [provider(8, text('Netflix'))],
          rent: [provider(2, text('Apple TV'))],
          buy: [provider(3, text('Google Play'))],
        },
        UA: {
          link: `https://www.themoviedb.org/movie/${FULL_MOVIE_ID}/watch?locale=UA`,
          flatrate: [provider(9, text('Megogo'))],
        },
      },
    },
  };
}

function detailSections(id: number) {
  if (id === FULL_MOVIE_ID) return fullSections(OTHER_FULL_MOVIE_ID);
  if (id === OTHER_FULL_MOVIE_ID) return fullSections(FULL_MOVIE_ID);
  if (id === EMPTY_MOVIE_ID) return emptySections();
  if (id === LONG_TEXT_MOVIE_ID) return fullSections(FULL_MOVIE_ID, () => 'x'.repeat(200));
  return {};
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
  if (/^\/movie\/\d+$/.test(path)) {
    return route.fulfill({
      json: {
        ...movie(1, 'Detail movie'),
        genres: GENRES,
        runtime: 120,
        tagline: null,
        ...detailSections(Number(path.split('/').pop())),
      },
    });
  }
  return route.fulfill({ json: paginated(['Row movie', 'Hero movie']) });
}

/** Answers every TMDB request from fixtures, so the tests need no token or network. */
export async function mockTmdb(page: Page): Promise<void> {
  await page.route('**/api/tmdb/**', (route) => respond(route, new URL(route.request().url())));
  await page.route(/^https:\/\/(image\.tmdb\.org|i\.ytimg\.com)\//, (route) =>
    route.fulfill({ contentType: 'image/png', body: ONE_PIXEL_PNG })
  );
}
