import type { TVDetails } from '@repo/api';
import { ROUTE_PATHS } from '@repo/routes';
import {
  buildPaginated,
  buildTv,
  buildTvDetails,
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
import { TVDetail } from '../tv-detail-page';

const DETAILS = {
  ...buildTv({
    id: 42,
    name: 'Severance',
    overview: 'Work and life, surgically divided.',
    first_air_date: '2022-02-18',
  }),
  genres: [{ id: 18, name: 'Drama' }],
  number_of_seasons: 3,
  number_of_episodes: 24,
  tagline: null,
};

const SECTIONS: Partial<TVDetails> = {
  created_by: [
    { id: 9, credit_id: 'creator-9', name: 'Dan Erickson', gender: 2, profile_path: null },
  ],
  seasons: [
    {
      id: 100,
      name: 'Specials',
      overview: '',
      air_date: null,
      episode_count: 2,
      poster_path: null,
      season_number: 0,
    },
    {
      id: 101,
      name: 'Season 1',
      overview: 'Mark leads a team of office workers.',
      air_date: '2022-02-18',
      episode_count: 9,
      poster_path: '/season-1.jpg',
      season_number: 1,
    },
    {
      id: 102,
      name: 'Season 2',
      overview: '',
      air_date: '2025-01-17',
      episode_count: 1,
      poster_path: null,
      season_number: 2,
    },
  ],
  credits: {
    cast: [
      {
        id: 7,
        credit_id: 'credit-7',
        name: 'Adam Scott',
        character: 'Mark Scout',
        profile_path: null,
        order: 0,
      },
    ],
    crew: [
      {
        id: 8,
        credit_id: 'credit-8',
        name: 'Ben Stiller',
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
  recommendations: buildPaginated([buildTv({ id: 11, name: 'Dark' })]),
  similar: buildPaginated([buildTv({ id: 12, name: 'Lost' })]),
  reviews: buildPaginated([
    {
      id: 'review-1',
      author: 'garethmb',
      author_details: { rating: 8 },
      content: 'A great show.',
      created_at: '2024-03-15T12:00:00.000Z',
      url: 'https://www.themoviedb.org/review/review-1',
    },
  ]),
  'watch/providers': {
    results: {
      US: {
        link: 'https://www.themoviedb.org/tv/42/watch?locale=US',
        flatrate: [{ provider_id: 350, provider_name: 'Apple TV Plus', logo_path: null }],
      },
    },
  },
};

const FULL_DETAILS = buildTvDetails({ ...DETAILS, ...SECTIONS });

function mockDetails(details: unknown) {
  server.use(http.get('*/api/tmdb/tv/42', () => HttpResponse.json(details as object)));
}

function renderPage(path: string) {
  return renderWithProviders(
    <Routes>
      <Route
        path={ROUTE_PATHS.TV_DETAIL}
        element={
          <PageBoundary>
            <TVDetail />
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
    ['Seasons', 'No seasons listed.'],
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

describe('TV Detail page', () => {
  beforeEach(() => {
    // React logs errors caught by boundaries; the tests assert the UI.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
  });

  afterEach(() => vi.restoreAllMocks());

  it('shows the show, with its seasons and episodes where a movie has its runtime', async () => {
    mockDetails(DETAILS);
    const { container } = renderPage('/tv/42');

    expect(await screen.findByRole('heading', { level: 1, name: 'Severance' })).toBeInTheDocument();
    expect(screen.getByText('Work and life, surgically divided.')).toBeInTheDocument();
    expect(screen.getByText('3 seasons, 24 episodes')).toBeInTheDocument();
    expect(screen.getByText('2022')).toBeInTheDocument();
    expect(screen.getByText('Drama')).toBeInTheDocument();
    expect(document.title).toBe('Severance · CinePulse');
    await expectNoA11yViolations(container);
  });

  it('gets every section from one request, the same as a movie', async () => {
    const requests: URL[] = [];
    server.use(
      http.get('*/api/tmdb/*', ({ request }) => {
        requests.push(new URL(request.url));
        return HttpResponse.json(FULL_DETAILS);
      })
    );
    renderPage('/tv/42');

    await screen.findByRole('region', { name: 'Reviews' });

    expect(requests.map((url) => url.pathname)).toEqual(['/api/tmdb/tv/42']);
    expect(requests[0]?.searchParams.get('append_to_response')).toBe(
      'credits,videos,images,recommendations,similar,reviews,watch/providers'
    );
  });

  it('puts the six sections in order, below the hero', async () => {
    mockDetails(FULL_DETAILS);
    renderPage('/tv/42');

    await screen.findByRole('heading', { level: 1, name: 'Severance' });

    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    ).toEqual([
      'Where to watch',
      'Seasons',
      'Cast',
      'Videos and images',
      'More like this',
      'Reviews',
    ]);
  });

  it('lists the seasons in the order of TMDB, with the specials last', async () => {
    mockDetails(FULL_DETAILS);
    renderPage('/tv/42');

    const seasons = await screen.findByRole('region', { name: 'Seasons' });

    expect(
      within(seasons)
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent)
    ).toEqual(['Season 1', 'Season 2', 'Specials']);

    const [first, second] = within(seasons).getAllByRole('listitem');
    expect(first).toHaveTextContent('2022');
    expect(first).toHaveTextContent('9 episodes');
    expect(first).toHaveTextContent('Mark leads a team of office workers.');
    expect(second).toHaveTextContent('1 episode');
    expect(second).not.toHaveTextContent('1 episodes');
  });

  it('adds the creator to the directors and writers, linked to the person', async () => {
    mockDetails(FULL_DETAILS);
    renderPage('/tv/42');

    const cast = await screen.findByRole('region', { name: 'Cast' });
    const line = within(cast).getByRole('list', { name: 'Directors and writers' });

    expect(within(line).getByRole('link', { name: 'Dan Erickson' })).toHaveAttribute(
      'href',
      '/person/9'
    );
    expect(within(line).getAllByRole('listitem')[0]).toHaveTextContent('Dan Erickson Creator');
    expect(within(line).getByRole('link', { name: 'Ben Stiller' })).toHaveAttribute(
      'href',
      '/person/8'
    );
  });

  it('shows the content of each section', async () => {
    mockDetails(FULL_DETAILS);
    const { container } = renderPage('/tv/42');

    const cast = await screen.findByRole('region', { name: 'Cast' });
    expect(within(cast).getByRole('link', { name: /Adam Scott/ })).toHaveAttribute(
      'href',
      '/person/7'
    );

    const media = screen.getByRole('region', { name: 'Videos and images' });
    expect(within(media).getByRole('link', { name: /Official Trailer/ })).toHaveAttribute(
      'href',
      'https://www.youtube.com/watch?v=abc'
    );
    expect(within(media).getByRole('img', { name: 'Severance, image 1' })).toBeInTheDocument();

    const providers = screen.getByRole('region', { name: 'Where to watch' });
    expect(within(providers).getByText('Apple TV Plus')).toBeInTheDocument();

    const reviews = screen.getByRole('region', { name: 'Reviews' });
    expect(within(reviews).getByText('A great show.')).toBeInTheDocument();

    await expectNoA11yViolations(container);
  });

  it('shows recommended shows as linked cards with an add button', async () => {
    mockDetails(FULL_DETAILS);
    renderPage('/tv/42');

    const row = await screen.findByRole('region', { name: 'More like this' });

    expect(within(row).getByRole('link', { name: 'Dark' })).toHaveAttribute('href', '/tv/11');
    expect(within(row).queryByRole('link', { name: 'Lost' })).not.toBeInTheDocument();
    expect(
      within(row).getByRole('button', { name: 'Add Dark to your watchlist' })
    ).toBeInTheDocument();
  });

  it('falls back to similar shows when there are no recommendations', async () => {
    mockDetails({ ...FULL_DETAILS, recommendations: buildPaginated([]) });
    renderPage('/tv/42');

    const row = await screen.findByRole('region', { name: 'More like this' });

    expect(within(row).getByRole('link', { name: 'Lost' })).toHaveAttribute('href', '/tv/12');
  });

  it('offers the watchlist on the hero', async () => {
    mockDetails(FULL_DETAILS);
    renderPage('/tv/42');

    expect(await screen.findByRole('button', { name: 'Add to watchlist' })).toBeInTheDocument();
  });

  it('says so in each section when TMDB has nothing for it', async () => {
    mockDetails(buildTvDetails({ ...DETAILS }));
    const { container } = renderPage('/tv/42');

    await expectEverySectionEmpty();
    await expectNoA11yViolations(container);
  });

  it('keeps the hero and shows empty sections when a response lacks the appended blocks', async () => {
    mockDetails(DETAILS);
    renderPage('/tv/42');

    expect(await screen.findByRole('heading', { level: 1, name: 'Severance' })).toBeInTheDocument();
    await expectEverySectionEmpty();
  });

  it('shows no count in the hero when TMDB knows none yet', async () => {
    mockDetails({ ...DETAILS, number_of_seasons: 0, number_of_episodes: 0 });
    renderPage('/tv/42');

    await screen.findByRole('heading', { level: 1, name: 'Severance' });

    expect(screen.queryByText(/\d (season|episode)/)).not.toBeInTheDocument();
  });

  it('offers a retry when the request fails', async () => {
    server.use(http.get('*/api/tmdb/tv/42', () => new HttpResponse(null, { status: 500 })));
    renderPage('/tv/42');

    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Seasons' })).not.toBeInTheDocument();
  });

  it('shows NotFound for an id TMDB does not know', async () => {
    server.use(http.get('*/api/tmdb/tv/404', () => new HttpResponse(null, { status: 404 })));
    renderPage('/tv/404');

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it.each(['abc', '0', '-1', '1.5'])(
    'shows NotFound for the invalid id %s without calling TMDB',
    async (id) => {
      renderPage(`/tv/${id}`);

      expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    }
  );
});
