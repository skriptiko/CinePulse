import {
  buildMovie,
  buildPaginated,
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
import { Movies } from '../movies-page';

const TMDB = '*/api/tmdb';

const GENRES = [
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comedy' },
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
    HttpResponse.json(buildPaginated([buildMovie({ title: `Found: ${params.get('query')}` })])),
}: {
  discover?: PageResponder;
  search?: PageResponder;
} = {}) {
  server.use(
    http.get(`${TMDB}/genre/movie/list`, () => HttpResponse.json({ genres: GENRES })),
    http.get(`${TMDB}/discover/movie`, ({ request }) =>
      discover(new URL(request.url).searchParams)
    ),
    http.get(`${TMDB}/search/movie`, ({ request }) => search(new URL(request.url).searchParams))
  );
}

/** Two pages of two movies; titles name the page, so tests can tell them apart. */
function discoverPage(params: URLSearchParams): Response {
  const page = Number(params.get('page') ?? '1');
  return HttpResponse.json(
    buildPaginated(
      [buildMovie({ title: `Discover p${page} a` }), buildMovie({ title: `Discover p${page} b` })],
      { page, total_pages: 2, total_results: 4 }
    )
  );
}

function LocationProbe() {
  const { search } = useLocation();
  return <div data-testid="location">{search}</div>;
}

function renderMovies(route = '/movies') {
  return renderWithProviders(
    <Suspense fallback={<p>Loading page</p>}>
      <Movies />
      <LocationProbe />
    </Suspense>,
    { route }
  );
}

function currentSearch(): URLSearchParams {
  return new URLSearchParams(screen.getByTestId('location').textContent ?? '');
}

describe('Movies page', () => {
  it('labels the page and its controls', async () => {
    mockTmdb();
    const { user } = renderMovies();

    await screen.findByText('Discover p1 a');

    expect(document.title).toBe('Movies · CinePulse');
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
    // Testing Library does not map the <search> element to its role yet.
    expect(
      screen.getByRole('searchbox', { name: 'Search movies' }).closest('search')
    ).not.toBeNull();
    expect(screen.getByRole('group', { name: 'Filter by genre' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Sort by/ }));
    expect(await screen.findByRole('group', { name: 'Sort by' })).toBeInTheDocument();
  });

  it('switches the card size with a radio group', async () => {
    mockTmdb();
    const { user } = renderMovies();

    await screen.findByText('Discover p1 a');
    const group = screen.getByRole('radiogroup', { name: 'Card size' });
    const compact = within(group).getByRole('radio', { name: 'Compact cards' });
    const large = within(group).getByRole('radio', { name: 'Large cards' });
    expect(large).toBeChecked();

    await user.click(compact);
    expect(compact).toBeChecked();

    // Clicking the active item must not leave the group empty.
    await user.click(compact);
    expect(compact).toBeChecked();
  });

  it('stays on the page when the search form is submitted', async () => {
    mockTmdb();
    const { user } = renderMovies();

    await user.type(await screen.findByRole('searchbox', { name: 'Search movies' }), 'dune{Enter}');

    expect(screen.getByRole('searchbox', { name: 'Search movies' })).toHaveValue('dune');
  });

  it('lists popular movies of every genre by default', async () => {
    mockTmdb();
    const requests = recordRequests('/discover/movie');
    const { container } = renderMovies();

    expect(await screen.findByText('Discover p1 a')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('4 movies found');
    expect(Object.fromEntries(requests[0] ?? [])).toEqual({
      page: '1',
      sort_by: 'popularity.desc',
    });
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    await expectNoA11yViolations(container);
  });

  it('filters by genre on the server and pushes it to the URL', async () => {
    mockTmdb();
    const requests = recordRequests('/discover/movie');
    const { user } = renderMovies();

    await user.click(await screen.findByRole('button', { name: 'Action' }));

    await waitFor(() => expect(requests.at(-1)?.get('with_genres')).toBe('28'));
    // The URL commits with the transition, once the new results have loaded.
    await waitFor(() => expect(currentSearch().get('genre')).toBe('28'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Action' })).toHaveAttribute('aria-pressed', 'true')
    );
  });

  it('reads genre and sort from the URL', async () => {
    mockTmdb();
    const requests = recordRequests('/discover/movie');
    renderMovies('/movies?genre=35&sort=rating');

    await screen.findByText('Discover p1 a');

    expect(Object.fromEntries(requests[0] ?? [])).toEqual({
      page: '1',
      with_genres: '35',
      sort_by: 'vote_average.desc',
      'vote_count.gte': '200',
    });
    expect(screen.getByRole('button', { name: 'Comedy' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Sort by: Rating' })).toBeInTheDocument();
  });

  it('falls back to defaults for invalid URL values', async () => {
    mockTmdb();
    const requests = recordRequests('/discover/movie');
    renderMovies('/movies?genre=abc&sort=bogus');

    await screen.findByText('Discover p1 a');

    expect(Object.fromEntries(requests[0] ?? [])).toEqual({
      page: '1',
      sort_by: 'popularity.desc',
    });
  });

  it('sorts on the server and pushes the sort to the URL', async () => {
    mockTmdb();
    const requests = recordRequests('/discover/movie');
    const { user } = renderMovies();

    await user.click(await screen.findByRole('button', { name: 'Sort by: Popular' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Newest' }));

    await waitFor(() => expect(requests.at(-1)?.get('sort_by')).toBe('primary_release_date.desc'));
    expect(requests.at(-1)?.get('primary_release_date.lte')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    await waitFor(() => expect(currentSearch().get('sort')).toBe('newest'));
  });

  it('switches to search, which disables genre and sort', async () => {
    mockTmdb();
    const searches = recordRequests('/search/movie');
    const { user } = renderMovies('/movies?genre=28');

    await user.type(await screen.findByRole('searchbox', { name: 'Search movies' }), 'dune');

    expect(await screen.findByText('Found: dune')).toBeInTheDocument();
    expect(searches).toHaveLength(1);
    expect(searches[0]?.get('query')).toBe('dune');
    expect(currentSearch().get('q')).toBe('dune');
    // The genre stays in the URL for when the search is cleared.
    expect(currentSearch().get('genre')).toBe('28');
    expect(screen.getByRole('button', { name: 'Action' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Sort by/ })).toBeDisabled();
    expect(screen.getByText(/Genre and sort don.t apply to search results/)).toBeInTheDocument();
  });

  it('shows the query in the empty state and clears the search from there', async () => {
    mockTmdb({ search: () => HttpResponse.json(buildPaginated([])) });
    const { user } = renderMovies('/movies?q=zzzz');

    expect(
      await screen.findByRole('heading', { name: 'No movies found for “zzzz”' })
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('0 movies found');

    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(await screen.findByText('Discover p1 a')).toBeInTheDocument();
    expect(currentSearch().has('q')).toBe(false);
    expect(screen.getByRole('searchbox', { name: 'Search movies' })).toHaveValue('');
  });

  it('loads the next page, then ends the list', async () => {
    mockTmdb();
    const { user } = renderMovies();

    await user.click(await screen.findByRole('button', { name: 'Load more' }));

    expect(await screen.findByText('Discover p2 a')).toBeInTheDocument();
    expect(screen.getByText('Discover p1 a')).toBeInTheDocument();
    expect(screen.getByText("That's all")).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('shows a next-page failure inline, keeps loaded movies and retries', async () => {
    let failNextPage = true;
    mockTmdb({
      discover: (params) =>
        params.get('page') === '2' && failNextPage
          ? new HttpResponse(null, { status: 500 })
          : discoverPage(params),
    });
    const { user } = renderMovies();

    await user.click(await screen.findByRole('button', { name: 'Load more' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load more movies.");
    expect(screen.getByText('Discover p1 a')).toBeInTheDocument();

    failNextPage = false;
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Discover p2 b')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    const list = screen.getAllByRole('list')[0];
    expect(within(list as HTMLElement).getAllByRole('listitem')).toHaveLength(4);
  });
});
