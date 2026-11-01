import { ROUTE_PATHS } from '@repo/routes';
import {
  buildMovieCredit,
  buildPersonDetails,
  buildTvCredit,
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
import { PersonDetail } from '../person-page';

const PERSON = buildPersonDetails({
  id: 42,
  name: 'Zendaya',
  profile_path: '/zendaya.jpg',
  known_for_department: 'Acting',
  birthday: '1996-09-01',
  place_of_birth: 'Oakland, California, USA',
  biography: 'An actress.\n\nAnd a singer.',
  combined_credits: {
    cast: [
      buildMovieCredit({
        id: 11,
        title: 'Dune',
        character: 'Chani',
        release_date: '2021-09-15',
        vote_count: 900,
      }),
      buildTvCredit({
        id: 12,
        name: 'Euphoria',
        character: 'Rue Bennett',
        first_air_date: '2019-06-16',
        vote_count: 800,
      }),
      buildTvCredit({
        id: 13,
        name: 'Late Night',
        character: 'Self - Guest',
        first_air_date: '2014-02-25',
        genre_ids: [10767],
        vote_count: 9000,
      }),
    ],
    crew: [
      buildTvCredit({
        id: 12,
        name: 'Euphoria',
        job: 'Executive Producer',
        first_air_date: '2019-06-16',
        vote_count: 800,
      }),
    ],
  },
});

function mockPerson(person: unknown) {
  server.use(http.get('*/api/tmdb/person/42', () => HttpResponse.json(person as object)));
}

function renderPage(path: string) {
  return renderWithProviders(
    <Routes>
      <Route
        path={ROUTE_PATHS.PERSON_DETAIL}
        element={
          <PageBoundary>
            <PersonDetail />
          </PageBoundary>
        }
      />
    </Routes>,
    { route: path }
  );
}

describe('Person page', () => {
  beforeEach(() => {
    // React logs errors caught by boundaries; the tests assert the UI.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it('shows the person', async () => {
    mockPerson(PERSON);
    const { container } = renderPage('/person/42');

    expect(await screen.findByRole('heading', { level: 1, name: 'Zendaya' })).toBeInTheDocument();
    expect(screen.getByText('Acting')).toBeInTheDocument();
    expect(screen.getByText('Sep 1, 1996')).toBeInTheDocument();
    expect(screen.getByText('Oakland, California, USA')).toBeInTheDocument();
    expect(container.querySelector('img[src$="/h632/zendaya.jpg"]')).toBeInTheDocument();
    expect(document.title).toBe('Zendaya · CinePulse');
    await expectNoA11yViolations(container);
  });

  it('gets the person and the credits from one request', async () => {
    const requests: URL[] = [];
    server.use(
      http.get('*/api/tmdb/*', ({ request }) => {
        requests.push(new URL(request.url));
        return HttpResponse.json(PERSON);
      })
    );
    renderPage('/person/42');

    await screen.findByRole('region', { name: 'Filmography' });

    expect(requests.map((url) => url.pathname)).toEqual(['/api/tmdb/person/42']);
    expect(requests[0]?.searchParams.get('append_to_response')).toBe('combined_credits');
  });

  it('puts the sections in order', async () => {
    mockPerson(PERSON);
    renderPage('/person/42');

    await screen.findByRole('heading', { level: 1, name: 'Zendaya' });

    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    ).toEqual(['Biography', 'Known for', 'Filmography']);
  });

  it('shows the known titles as cards with an add button, without the talk show', async () => {
    mockPerson(PERSON);
    renderPage('/person/42');

    const row = await screen.findByRole('region', { name: 'Known for' });

    expect(
      within(row)
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent)
    ).toEqual(['Dune', 'Euphoria']);
    expect(within(row).getByRole('link', { name: 'Dune' })).toHaveAttribute('href', '/movies/11');
    expect(
      within(row).getByRole('button', { name: 'Add Dune to your watchlist' })
    ).toBeInTheDocument();
    expect(
      within(row).getByRole('button', { name: 'Add Euphoria to your watchlist' })
    ).toBeInTheDocument();
  });

  it('lists every credit, newest first, with one row per title', async () => {
    mockPerson(PERSON);
    const { container } = renderPage('/person/42');

    const list = await screen.findByRole('region', { name: 'Filmography' });
    const rows = within(list).getAllByRole('listitem');

    expect(rows.map((row) => row.textContent)).toEqual([
      '2021DuneChani',
      '2019EuphoriaRue Bennett, Executive Producer',
      '2014Late NightSelf - Guest',
    ]);
    expect(within(list).getByRole('link', { name: 'Dune' })).toHaveAttribute('href', '/movies/11');
    expect(within(list).getByRole('link', { name: 'Euphoria' })).toHaveAttribute('href', '/tv/12');
    await expectNoA11yViolations(container);
  });

  it('says so in each section when TMDB has nothing for it', async () => {
    mockPerson(buildPersonDetails({ id: 42, name: 'New face', biography: '' }));
    const { container } = renderPage('/person/42');

    const expected = [
      ['Biography', 'No biography yet.'],
      ['Known for', 'No titles to show yet.'],
      ['Filmography', 'No credits listed.'],
    ] as const;

    for (const [name, line] of expected) {
      const region = await screen.findByRole('region', { name });
      expect(within(region).getByText(line)).toBeInTheDocument();
    }
    await expectNoA11yViolations(container);
  });

  it('keeps the hero and shows empty sections when a response lacks the appended block', async () => {
    const { combined_credits: _credits, ...person } = PERSON;
    mockPerson(person);
    renderPage('/person/42');

    expect(await screen.findByRole('heading', { level: 1, name: 'Zendaya' })).toBeInTheDocument();
    expect(screen.getByText('No credits listed.')).toBeInTheDocument();
  });

  it('survives credits that lack a date, a title and a poster', async () => {
    mockPerson({
      ...PERSON,
      combined_credits: {
        cast: [
          { id: 1, media_type: 'movie', credit_id: 'a' },
          { id: 2, media_type: 'tv', credit_id: 'b', name: 'Named', character: 'Lead' },
        ],
        crew: [{ id: 3, media_type: 'movie', credit_id: 'c', job: 'Writer' }],
      },
    });
    renderPage('/person/42');

    const list = await screen.findByRole('region', { name: 'Filmography' });

    expect(within(list).getAllByRole('link', { name: 'Untitled' })).toHaveLength(2);
    expect(within(list).getByRole('link', { name: 'Named' })).toHaveAttribute('href', '/tv/2');
    const row = screen.getByRole('region', { name: 'Known for' });
    expect(within(row).getByRole('heading', { level: 3 })).toHaveTextContent('Named');
  });

  it('offers a retry when the request fails', async () => {
    server.use(http.get('*/api/tmdb/person/42', () => new HttpResponse(null, { status: 500 })));
    renderPage('/person/42');

    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Filmography' })).not.toBeInTheDocument();
  });

  it('shows NotFound for an id TMDB does not know', async () => {
    server.use(http.get('*/api/tmdb/person/404', () => new HttpResponse(null, { status: 404 })));
    renderPage('/person/404');

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it.each(['abc', '0', '-1', '1.5', '01', '1e3'])(
    'shows NotFound for the id %s without calling TMDB',
    async (id) => {
      const requests: string[] = [];
      server.use(
        http.get('*/api/tmdb/*', ({ request }) => {
          requests.push(request.url);
          return HttpResponse.json({});
        })
      );
      renderPage(`/person/${id}`);

      expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
      expect(requests).toEqual([]);
    }
  );
});
