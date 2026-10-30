import { HttpResponse, http } from 'msw';
import { buildMovie, buildPaginated } from '../factories/movie';

// `*` matches any origin, so handlers work in both jsdom and node environments.
const TMDB = '*/api/tmdb';

const movieHandlers = [
  http.get(`${TMDB}/movie/:category`, ({ request }) => {
    const page = Number(new URL(request.url).searchParams.get('page') ?? '1');
    return HttpResponse.json(
      buildPaginated([buildMovie(), buildMovie(), buildMovie()], { page, total_pages: 2 })
    );
  }),
];

const genreHandlers = [
  http.get(`${TMDB}/genre/movie/list`, () =>
    HttpResponse.json({ genres: [{ id: 28, name: 'Action' }] })
  ),
];

const trendingHandlers = [
  http.get(`${TMDB}/trending/movie/:window`, () =>
    HttpResponse.json(buildPaginated([{ ...buildMovie(), media_type: 'movie' }]))
  ),
];

/** Default happy-path handlers; override per test with `server.use(...)`. */
export const handlers = [...movieHandlers, ...genreHandlers, ...trendingHandlers];
