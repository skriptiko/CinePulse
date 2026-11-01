import {
  buildPaginated,
  buildTv,
  expectNoA11yViolations,
  renderWithProviders,
  screen,
  server,
  waitFor,
  within,
} from '@repo/test-utils';
import { HttpResponse, http } from 'msw';
import { Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { TVShows } from '../tv-page';

const TMDB = '*/api/tmdb';

const GENRES = [
  { id: 18, name: 'Drama' },
  { id: 10759, name: 'Action & Adventure' },
];

/** Records the query params of every request to `path`. */
function recordRequests(path: string): URLSearchParams[] {
  const requests: URLSearchParams[] = [];
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname === `/api/tmdb${path}`) requests.push(url.searchParams);
  });
  return requests;
}

type PageResponder = (params: URLSearchParams) => Response;

function mockTmdb({
  discover = (params) => discoverPage(params),
  search = (params) =>
    HttpResponse.json(buildPaginated([buildTv({ name: `Found: ${params.get('query')}` })])),
}: {
  discover?: PageResponder;
  search?: PageResponder;
} = {}) {
  server.use(
    http.get(`${TMDB}/genre/tv/list`, () => HttpResponse.json({ genres: GENRES })),
    http.get(`${TMDB}/discover/tv`, ({ request }) => discover(new URL(request.url).searchParams)),
    http.get(`${TMDB}/search/tv`, ({ request }) => search(new URL(request.url).searchParams))
  );
}

/** Two pages of two shows; names tell the page, so tests can tell them apart. */
function discoverPage(params: URLSearchParams): Response {
  const page = Number(params.get('page') ?? '1');
  return HttpResponse.json(
    buildPaginated(
      [buildTv({ name: `Discover p${page} a` }), buildTv({ name: `Discover p${page} b` })],
      { page, total_pages: 2, total_results: 4 }
    )
  );
}

function LocationProbe() {
  const { search } = useLocation();
  return <div data-testid="location">{search}</div>;
}

function renderTV(route = '/tv') {
  return renderWithProviders(
    <Suspense fallback={<p>Loading page</p>}>
      <TVShows />
      <LocationProbe />
    </Suspense>,
    { route }
  );
}

function currentSearch(): URLSearchParams {
  return new URLSearchParams(screen.getByTestId('location').textContent ?? '');
}

describe('TV Shows page', () => {
  it('names the page and its controls after TV shows', async () => {
    mockTmdb();
    renderTV();

    await screen.findByText('Discover p1 a');

    expect(document.title).toBe('TV Shows · CinePulse');
    expect(screen.getByRole('heading', { level: 1, name: 'TV Shows' })).toBeInTheDocument();
    expect(screen.getByText('Explore our collection of TV shows')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search TV shows' })).toHaveAttribute(
      'placeholder',
      'Search TV shows...'
    );
    expect(screen.getByRole('group', { name: 'Filter by genre' })).toBeInTheDocument();
  });

  it('lists popular shows of every genre by default', async () => {
    mockTmdb();
    const requests = recordRequests('/discover/tv');
    const { container } = renderTV();

    expect(await screen.findByText('Discover p1 a')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('4 TV shows found');
    expect(Object.fromEntries(requests[0] ?? [])).toEqual({
      page: '1',
      sort_by: 'popularity.desc',
    });
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    await expectNoA11yViolations(container);
  });

  it('counts a single show in the singular', async () => {
    mockTmdb({
      discover: () => HttpResponse.json(buildPaginated([buildTv()], { total_results: 1 })),
    });
    renderTV();

    expect(await screen.findByRole('status')).toHaveTextContent('1 TV show found');
  });

  it('keeps a card without a link, with an action that names the show', async () => {
    mockTmdb({
      discover: () => HttpResponse.json(buildPaginated([buildTv({ id: 7, name: 'Severance' })])),
    });
    renderTV();

    const add = await screen.findByRole('button', { name: 'Add Severance to your watchlist' });

    expect(add.closest('li')).toHaveTextContent('Severance');
    expect(within(add.closest('li') as HTMLElement).queryByRole('link')).not.toBeInTheDocument();
  });

  it('keeps the first copy of a show that two pages repeat', async () => {
    const repeated = buildTv({ name: 'Repeated' });
    mockTmdb({
      discover: (params) =>
        HttpResponse.json(
          buildPaginated([repeated], { page: Number(params.get('page') ?? '1'), total_pages: 2 })
        ),
    });
    const { user } = renderTV();

    await user.click(await screen.findByRole('button', { name: 'Load more' }));

    await screen.findByText("That's all");
    expect(screen.getAllByText('Repeated')).toHaveLength(1);
  });

  it('filters by a TV genre on the server and pushes it to the URL', async () => {
    mockTmdb();
    const requests = recordRequests('/discover/tv');
    const { user } = renderTV();

    await user.click(await screen.findByRole('button', { name: 'Action & Adventure' }));

    await waitFor(() => expect(requests.at(-1)?.get('with_genres')).toBe('10759'));
    await waitFor(() => expect(currentSearch().get('genre')).toBe('10759'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Action & Adventure' })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    );
  });

  it('reads genre and sort from the URL', async () => {
    mockTmdb();
    const requests = recordRequests('/discover/tv');
    renderTV('/tv?genre=18&sort=rating');

    await screen.findByText('Discover p1 a');

    expect(Object.fromEntries(requests[0] ?? [])).toEqual({
      page: '1',
      with_genres: '18',
      sort_by: 'vote_average.desc',
      'vote_count.gte': '200',
    });
    expect(screen.getByRole('button', { name: 'Drama' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Sort by: Rating' })).toBeInTheDocument();
  });

  it('falls back to defaults for invalid URL values', async () => {
    mockTmdb();
    const requests = recordRequests('/discover/tv');
    renderTV('/tv?genre=abc&sort=bogus');

    await screen.findByText('Discover p1 a');

    expect(Object.fromEntries(requests[0] ?? [])).toEqual({
      page: '1',
      sort_by: 'popularity.desc',
    });
  });

  it('sorts newest by first air date, with no movie param, and pushes it to the URL', async () => {
    mockTmdb();
    const requests = recordRequests('/discover/tv');
    const { user } = renderTV();

    await user.click(await screen.findByRole('button', { name: 'Sort by: Popular' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Newest' }));

    await waitFor(() => expect(requests.at(-1)?.get('sort_by')).toBe('first_air_date.desc'));
    expect(requests.at(-1)?.get('first_air_date.lte')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(requests.at(-1)?.has('primary_release_date.lte')).toBe(false);
    await waitFor(() => expect(currentSearch().get('sort')).toBe('newest'));
  });

  it('switches to TV search, which disables genre and sort', async () => {
    mockTmdb();
    const searches = recordRequests('/search/tv');
    const { user } = renderTV('/tv?genre=18');

    await user.type(await screen.findByRole('searchbox', { name: 'Search TV shows' }), 'dark');

    expect(await screen.findByText('Found: dark')).toBeInTheDocument();
    expect(searches).toHaveLength(1);
    expect(searches[0]?.get('query')).toBe('dark');
    expect(currentSearch().get('q')).toBe('dark');
    expect(currentSearch().get('genre')).toBe('18');
    expect(screen.getByRole('button', { name: 'Drama' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Sort by/ })).toBeDisabled();
  });

  it('shows the query in the empty state and clears the search from there', async () => {
    mockTmdb({ search: () => HttpResponse.json(buildPaginated([])) });
    const { user, container } = renderTV('/tv?q=zzzz');

    expect(
      await screen.findByRole('heading', { name: 'No TV shows found for “zzzz”' })
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('0 TV shows found');
    await expectNoA11yViolations(container);

    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(await screen.findByText('Discover p1 a')).toBeInTheDocument();
    expect(currentSearch().has('q')).toBe(false);
    expect(screen.getByRole('searchbox', { name: 'Search TV shows' })).toHaveValue('');
  });

  it('resets the filters from an empty genre', async () => {
    mockTmdb({
      discover: (params) =>
        params.has('with_genres') ? HttpResponse.json(buildPaginated([])) : discoverPage(params),
    });
    const { user } = renderTV('/tv?genre=18&sort=newest');

    expect(await screen.findByRole('heading', { name: 'No TV shows found' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reset filters' }));

    expect(await screen.findByText('Discover p1 a')).toBeInTheDocument();
    expect(currentSearch().toString()).toBe('');
  });

  it('loads the next page, then ends the list', async () => {
    mockTmdb();
    const { user } = renderTV();

    await user.click(await screen.findByRole('button', { name: 'Load more' }));

    expect(await screen.findByText('Discover p2 a')).toBeInTheDocument();
    expect(screen.getByText('Discover p1 a')).toBeInTheDocument();
    expect(screen.getByText("That's all")).toBeInTheDocument();
  });

  it('shows a next-page failure inline, keeps loaded shows and retries', async () => {
    let failNextPage = true;
    mockTmdb({
      discover: (params) =>
        params.get('page') === '2' && failNextPage
          ? new HttpResponse(null, { status: 500 })
          : discoverPage(params),
    });
    const { user } = renderTV();

    await user.click(await screen.findByRole('button', { name: 'Load more' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load more TV shows.");
    expect(screen.getByText('Discover p1 a')).toBeInTheDocument();

    failNextPage = false;
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Discover p2 b')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
