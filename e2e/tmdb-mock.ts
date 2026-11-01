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

/** A movie with every section filled, and a second one to reach from its "More like this". */
export const FULL_MOVIE_ID = 7;
export const OTHER_FULL_MOVIE_ID = 8;
/** A movie whose sections all come back empty. */
export const EMPTY_MOVIE_ID = 9;
/** A movie whose every external string is one long word. */
export const LONG_TEXT_MOVIE_ID = 10;

/** The director of the full movies, so the cast leads to a full page. */
export const FULL_PERSON_ID = 2000;
/** A person TMDB knows little about: no photo, dates, biography or credits. */
export const EMPTY_PERSON_ID = 2001;
/** A person whose every external string is one long word. */
export const LONG_TEXT_PERSON_ID = 2002;
/** TMDB answers 404. */
export const UNKNOWN_PERSON_ID = 2003;

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

/**
 * Forty titles, one a year, half of them shows and the newest with the most votes; a talk show
 * with more votes than any; and a credit with nothing but its id.
 */
function personCredits(text = (value: string) => value) {
  const cast = Array.from({ length: 40 }, (_, index) => {
    const date = `${1980 + index}-01-01`;
    const role = {
      credit_id: `person-cast-${index}`,
      character: text(`Role ${index}`),
      vote_count: index,
    };

    return index % 2 === 0
      ? { ...movie(3000 + index, text(`Film ${index}`)), ...role, release_date: date }
      : {
          ...show(3000 + index, text(`Series ${index}`)),
          ...role,
          media_type: 'tv',
          first_air_date: date,
        };
  });
  const talkShow = {
    ...show(4000, text('Talk show')),
    media_type: 'tv',
    credit_id: 'person-talk-show',
    character: text('Self - Guest'),
    first_air_date: '2024-01-01',
    genre_ids: [10767],
    vote_count: 9000,
  };
  const crew = {
    ...show(3039, text('Series 39')),
    media_type: 'tv',
    credit_id: 'person-crew',
    department: 'Directing',
    job: text('Director'),
    first_air_date: '2019-01-01',
    vote_count: 39,
  };
  const bare = { id: 4001, media_type: 'movie', credit_id: 'person-bare' };

  return { cast: [...cast, talkShow, bare], crew: [crew] };
}

function personDetails(id: number) {
  const empty = {
    id,
    name: 'New face',
    biography: '',
    birthday: null,
    deathday: null,
    known_for_department: '',
    place_of_birth: null,
    profile_path: null,
    combined_credits: { cast: [], crew: [] },
  };
  const full = (text = (value: string) => value) => ({
    ...empty,
    name: text('Some Person'),
    biography: `${text('A long life. ').repeat(30)}\n\n${text('A second paragraph. ').repeat(30)}`,
    birthday: '1960-02-01',
    deathday: '2020-03-04',
    known_for_department: text('Directing'),
    place_of_birth: text('Kyiv, Ukraine'),
    profile_path: '/person.jpg',
    combined_credits: personCredits(text),
  });

  if (id === EMPTY_PERSON_ID) return empty;
  if (id === LONG_TEXT_PERSON_ID) return full(() => 'x'.repeat(200));
  return full();
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
      json: {
        ...movie(1, 'Detail movie'),
        genres: GENRES,
        runtime: 120,
        tagline: null,
        ...detailSections(Number(path.split('/').pop())),
      },
    });
  }
  if (/^\/person\/\d+$/.test(path)) {
    const id = Number(path.split('/').pop());
    if (id === UNKNOWN_PERSON_ID) return route.fulfill({ status: 404 });
    return route.fulfill({ json: personDetails(id) });
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
