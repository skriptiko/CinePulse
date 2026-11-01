import type { MovieDetails } from '@repo/api';
import { ROUTE_PATHS } from '@repo/routes';
import {
  buildMovie,
  buildMovieDetails,
  buildPaginated,
  expectNoA11yViolations,
  renderWithProviders,
  screen,
  server,
  within,
} from '@repo/test-utils';
import { PageBoundary } from '@repo/ui';
import { HttpResponse, http } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MovieDetail } from '../movie-detail-page';

const DETAILS = {
  ...buildMovie({ id: 42, title: 'Dune', overview: 'A desert planet.' }),
  genres: [{ id: 878, name: 'Sci-Fi' }],
  runtime: 155,
  tagline: null,
};

const SECTIONS: Partial<MovieDetails> = {
  credits: {
    cast: [
      {
        id: 7,
        credit_id: 'credit-7',
        name: 'Zendaya',
        character: 'Chani',
        profile_path: null,
        order: 0,
      },
    ],
    crew: [
      {
        id: 8,
        credit_id: 'credit-8',
        name: 'Denis Villeneuve',
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
        key: 'abc',
        name: 'Official Trailer',
        site: 'YouTube',
        type: 'Trailer',
        official: true,
      },
    ],
  },
  images: {
    backdrops: [{ file_path: '/still.jpg', width: 3840, height: 2160 }],
    posters: [],
    logos: [],
  },
  recommendations: buildPaginated([buildMovie({ id: 11, title: 'Arrival' })]),
  similar: buildPaginated([buildMovie({ id: 12, title: 'Sicario' })]),
  reviews: buildPaginated([
    {
      id: 'review-1',
      author: 'garethmb',
      author_details: { rating: 8 },
      content: 'A great film.',
      created_at: '2024-03-15T12:00:00.000Z',
      url: 'https://www.themoviedb.org/review/review-1',
    },
  ]),
  'watch/providers': {
    results: {
      US: {
        link: 'https://www.themoviedb.org/movie/42/watch?locale=US',
        flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: null }],
      },
      UA: {
        link: 'https://www.themoviedb.org/movie/42/watch?locale=UA',
        flatrate: [{ provider_id: 9, provider_name: 'Megogo', logo_path: null }],
      },
    },
  },
};

const FULL_DETAILS = buildMovieDetails({ ...DETAILS, ...SECTIONS });

function mockDetails(details: unknown) {
  server.use(http.get('*/api/tmdb/movie/42', () => HttpResponse.json(details as object)));
}

function renderPage(path: string) {
  return renderWithProviders(
    <Routes>
      <Route
        path={ROUTE_PATHS.MOVIE_DETAIL}
        element={
          <PageBoundary>
            <MovieDetail />
          </PageBoundary>
        }
      />
    </Routes>,
    { route: path }
  );
}

async function expectEverySectionEmpty() {
  const empty = [
    ['Where to watch', 'No streaming, rental or purchase options listed for United States.'],
    ['Cast', 'No cast listed yet.'],
    ['Videos and images', 'No videos or images yet.'],
    ['More like this', 'No similar titles yet.'],
    ['Reviews', 'No reviews yet.'],
  ] as const;

  for (const [name, line] of empty) {
    const region = await screen.findByRole('region', { name });
    expect(within(region).getByText(line)).toBeInTheDocument();
  }
}

describe('Movie Detail page', () => {
  beforeEach(() => {
    // React logs errors caught by boundaries; the tests assert the UI.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
  });

  afterEach(() => vi.restoreAllMocks());

  it('shows the movie', async () => {
    mockDetails(DETAILS);
    const { container } = renderPage('/movies/42');

    expect(await screen.findByRole('heading', { level: 1, name: 'Dune' })).toBeInTheDocument();
    expect(screen.getByText('A desert planet.')).toBeInTheDocument();
    expect(screen.getByText('2h 35m')).toBeInTheDocument();
    expect(screen.getByText('Sci-Fi')).toBeInTheDocument();
    expect(document.title).toBe('Dune · CinePulse');
    await expectNoA11yViolations(container);
  });

  it('gets every section from one request', async () => {
    const requests: URL[] = [];
    server.use(
      http.get('*/api/tmdb/*', ({ request }) => {
        requests.push(new URL(request.url));
        return HttpResponse.json(FULL_DETAILS);
      })
    );
    renderPage('/movies/42');

    await screen.findByRole('region', { name: 'Reviews' });

    expect(requests.map((url) => url.pathname)).toEqual(['/api/tmdb/movie/42']);
    expect(requests[0]?.searchParams.get('append_to_response')).toBe(
      'credits,videos,images,recommendations,similar,reviews,watch/providers'
    );
  });

  it('puts the five sections in order, below the hero', async () => {
    mockDetails(FULL_DETAILS);
    renderPage('/movies/42');

    await screen.findByRole('heading', { level: 1, name: 'Dune' });

    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    ).toEqual(['Where to watch', 'Cast', 'Videos and images', 'More like this', 'Reviews']);
  });

  it('shows the content of each section', async () => {
    mockDetails(FULL_DETAILS);
    const { container } = renderPage('/movies/42');

    const cast = await screen.findByRole('region', { name: 'Cast' });
    expect(within(cast).getByRole('link', { name: /Zendaya/ })).toHaveAttribute(
      'href',
      '/person/7'
    );
    expect(within(cast).getByRole('link', { name: 'Denis Villeneuve' })).toHaveAttribute(
      'href',
      '/person/8'
    );

    const media = screen.getByRole('region', { name: 'Videos and images' });
    expect(within(media).getByRole('link', { name: /Official Trailer/ })).toHaveAttribute(
      'href',
      'https://www.youtube.com/watch?v=abc'
    );
    expect(within(media).getByRole('img', { name: 'Dune, image 1' })).toBeInTheDocument();

    const reviews = screen.getByRole('region', { name: 'Reviews' });
    expect(within(reviews).getByText('A great film.')).toBeInTheDocument();

    await expectNoA11yViolations(container);
  });

  it('shows recommendations with an add button on each card, as the Home rows do', async () => {
    mockDetails(FULL_DETAILS);
    renderPage('/movies/42');

    const row = await screen.findByRole('region', { name: 'More like this' });

    expect(within(row).getByRole('link', { name: 'Arrival' })).toHaveAttribute(
      'href',
      '/movies/11'
    );
    expect(within(row).queryByRole('link', { name: 'Sicario' })).not.toBeInTheDocument();
    expect(
      within(row).getByRole('button', { name: 'Add Arrival to your watchlist' })
    ).toBeInTheDocument();
  });

  it('falls back to similar titles when there are no recommendations', async () => {
    mockDetails({ ...FULL_DETAILS, recommendations: buildPaginated([]) });
    renderPage('/movies/42');

    const row = await screen.findByRole('region', { name: 'More like this' });

    expect(within(row).getByRole('link', { name: 'Sicario' })).toBeInTheDocument();
  });

  it('shows the providers of the region in the browser language', async () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('uk-UA');
    mockDetails(FULL_DETAILS);
    renderPage('/movies/42');

    const providers = await screen.findByRole('region', { name: 'Where to watch' });

    expect(within(providers).getByText('Megogo')).toBeInTheDocument();
    expect(within(providers).queryByText('Netflix')).not.toBeInTheDocument();
    expect(within(providers).getByText('Streaming data by JustWatch')).toBeInTheDocument();
  });

  it('falls back to the US when the browser language names no region', async () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('uk');
    mockDetails(FULL_DETAILS);
    renderPage('/movies/42');

    const providers = await screen.findByRole('region', { name: 'Where to watch' });

    expect(within(providers).getByText('Netflix')).toBeInTheDocument();
  });

  it('names the country when it has no providers', async () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('fr-FR');
    mockDetails(FULL_DETAILS);
    renderPage('/movies/42');

    const providers = await screen.findByRole('region', { name: 'Where to watch' });

    expect(
      within(providers).getByText('No streaming, rental or purchase options listed for France.')
    ).toBeInTheDocument();
  });

  it('says so in each section when TMDB has nothing for it', async () => {
    mockDetails(buildMovieDetails({ ...DETAILS }));
    const { container } = renderPage('/movies/42');

    await expectEverySectionEmpty();
    await expectNoA11yViolations(container);
  });

  it('keeps the hero and shows empty sections when a response lacks the appended blocks', async () => {
    mockDetails(DETAILS);
    renderPage('/movies/42');

    expect(await screen.findByRole('heading', { level: 1, name: 'Dune' })).toBeInTheDocument();
    await expectEverySectionEmpty();
  });

  it('opens another movie at the top of the page', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    mockDetails(FULL_DETAILS);
    server.use(
      http.get('*/api/tmdb/movie/11', () =>
        HttpResponse.json(buildMovieDetails({ id: 11, title: 'Arrival' }))
      )
    );
    const { user } = renderPage('/movies/42');

    await user.click(await screen.findByRole('link', { name: 'Arrival' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Arrival' })).toBeInTheDocument();
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('leaves the scroll position to the browser on a direct visit', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    mockDetails(FULL_DETAILS);
    renderPage('/movies/42');

    await screen.findByRole('heading', { level: 1, name: 'Dune' });

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('offers a retry when the request fails', async () => {
    server.use(http.get('*/api/tmdb/movie/42', () => new HttpResponse(null, { status: 500 })));
    renderPage('/movies/42');

    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Cast' })).not.toBeInTheDocument();
  });

  it('shows NotFound for an id TMDB does not know', async () => {
    server.use(http.get('*/api/tmdb/movie/404', () => new HttpResponse(null, { status: 404 })));
    renderPage('/movies/404');

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('shows NotFound for an invalid id without calling TMDB', async () => {
    renderPage('/movies/abc');

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});
