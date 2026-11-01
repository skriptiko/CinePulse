import type { Person } from '@repo/api';
import { ROUTE_PATHS } from '@repo/routes';
import {
  buildMovie,
  buildPaginated,
  buildTv,
  expectNoA11yViolations,
  renderWithProviders,
  screen,
  server,
  waitFor,
  within,
} from '@repo/test-utils';
import { delay, HttpResponse, http } from 'msw';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Search } from '../search-page';

const TMDB = '*/api/tmdb';

const NO_QUERY_LINE = 'What are you looking for? Enter a title or a name above.';

function buildPerson(overrides: Partial<Person> = {}): Person {
  return {
    id: 7,
    name: 'Zendaya',
    original_name: 'Zendaya',
    profile_path: '/zendaya.jpg',
    adult: false,
    popularity: 10,
    gender: 1,
    known_for_department: 'Acting',
    known_for: [],
    ...overrides,
  };
}

/** Records the path and query of every TMDB search that was sent. */
function recordSearches(): string[] {
  const requests: string[] = [];
  server.events.on('request:start', ({ request }) => {
    const { pathname, searchParams } = new URL(request.url);
    if (pathname.startsWith('/api/tmdb/search/')) {
      requests.push(`${pathname.replace('/api/tmdb/search/', '')}:${searchParams.get('query')}`);
    }
  });
  return requests;
}

type Responder = (params: URLSearchParams) => Response | Promise<Response>;

function mockSearch({
  movie = (params) =>
    HttpResponse.json(
      buildPaginated([buildMovie({ id: 1, title: `Film ${params.get('query')}` })])
    ),
  tv = (params) =>
    HttpResponse.json(buildPaginated([buildTv({ id: 2, name: `Show ${params.get('query')}` })])),
  person = () => HttpResponse.json(buildPaginated([buildPerson({ id: 3, name: 'Zendaya' })])),
}: {
  movie?: Responder;
  tv?: Responder;
  person?: Responder;
} = {}) {
  server.use(
    http.get(`${TMDB}/search/movie`, ({ request }) => movie(new URL(request.url).searchParams)),
    http.get(`${TMDB}/search/tv`, ({ request }) => tv(new URL(request.url).searchParams)),
    http.get(`${TMDB}/search/person`, ({ request }) => person(new URL(request.url).searchParams))
  );
}

/** Two pages, each with what its number says; an overlap of one title. */
function twoPages(params: URLSearchParams): Response {
  const page = Number(params.get('page') ?? '1');
  return HttpResponse.json(
    buildPaginated(
      [
        buildMovie({ id: 100, title: 'On both pages' }),
        buildMovie({ id: 100 + page, title: `Only on page ${page}` }),
      ],
      { page, total_pages: 2, total_results: 3 }
    )
  );
}

function Probes() {
  const { search } = useLocation();
  const navigate = useNavigate();

  return (
    <>
      <div data-testid="location">{search}</div>
      <button type="button" onClick={() => navigate(-1)}>
        Go back
      </button>
      <Link to={ROUTE_PATHS.SEARCH}>Search icon</Link>
    </>
  );
}

function renderSearch(route = '/search') {
  return renderWithProviders(
    <>
      <Search />
      <Probes />
    </>,
    { route }
  );
}

function searchInput(): HTMLElement {
  return screen.getByRole('searchbox', { name: 'Search by title or name' });
}

function currentSearch(): string {
  return screen.getByTestId('location').textContent ?? '';
}

function tabs(): HTMLElement {
  return screen.getByRole('navigation', { name: 'Search results by type' });
}

describe('Search page', () => {
  describe('with no query', () => {
    it('asks what to look for and sends no request', async () => {
      const requests = recordSearches();
      const { container } = renderSearch();

      expect(screen.getByRole('heading', { level: 1, name: 'Search' })).toBeInTheDocument();
      expect(screen.getByText(NO_QUERY_LINE)).toBeInTheDocument();
      expect(document.title).toBe('Search · CinePulse');
      expect(requests).toEqual([]);
      await expectNoA11yViolations(container);
    });

    it('counts an empty or blank q as no query', () => {
      const requests = recordSearches();
      renderSearch('/search?q=%20%20&type=tv');

      expect(screen.getByText(NO_QUERY_LINE)).toBeInTheDocument();
      expect(requests).toEqual([]);
    });

    it('takes focus, so a press on the icon can be followed by typing', async () => {
      renderSearch();

      await waitFor(() => expect(searchInput()).toHaveFocus());
    });

    it('takes focus back when the icon drops the query of the open page', async () => {
      mockSearch();
      const { user } = renderSearch('/search?q=dune');
      await screen.findByText('Film dune');

      await user.click(screen.getByRole('link', { name: 'Search icon' }));

      expect(searchInput()).toHaveValue('');
      await waitFor(() => expect(searchInput()).toHaveFocus());
    });

    it('leaves focus on a tab, so moving between tabs is not interrupted', async () => {
      const { user } = renderSearch();
      await waitFor(() => expect(searchInput()).toHaveFocus());

      await user.click(within(tabs()).getByRole('link', { name: 'People' }));

      expect(within(tabs()).getByRole('link', { name: 'People' })).toHaveFocus();
    });
  });

  describe('the form', () => {
    it('has a visible label, a limit and a submit button', () => {
      renderSearch();

      expect(screen.getByText('Search by title or name').tagName).toBe('LABEL');
      expect(searchInput()).toHaveAttribute('maxlength', '100');
      expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('type', 'submit');
      expect(searchInput().closest('search')).toBeInTheDocument();
    });

    it('does not search while typing', async () => {
      mockSearch();
      const requests = recordSearches();
      const { user } = renderSearch();

      await user.type(searchInput(), 'dune');

      expect(currentSearch()).toBe('');
      expect(requests).toEqual([]);
      expect(screen.getByText(NO_QUERY_LINE)).toBeInTheDocument();
    });

    it('searches on Enter, with the query trimmed', async () => {
      mockSearch();
      const requests = recordSearches();
      const { user } = renderSearch();

      await user.type(searchInput(), '  dune  {Enter}');

      expect(await screen.findByText('Film dune')).toBeInTheDocument();
      expect(currentSearch()).toBe('?q=dune');
      expect(requests).toEqual(['movie:dune']);
      expect(searchInput()).toHaveValue('dune');
      expect(searchInput()).toHaveFocus();
      expect(document.title).toBe('Search: dune · CinePulse');
    });

    it('searches on a press of the button, and keeps the type', async () => {
      mockSearch();
      const { user } = renderSearch('/search?type=tv');

      await user.type(searchInput(), 'dark');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      expect(await screen.findByText('Show dark')).toBeInTheDocument();
      expect(currentSearch()).toBe('?type=tv&q=dark');
    });

    it('clears q on an empty submit, keeps the type and sends nothing', async () => {
      mockSearch();
      const { user } = renderSearch('/search?q=dune&type=tv');
      await screen.findByText('Show dune');
      const requests = recordSearches();

      await user.clear(searchInput());
      await user.keyboard('{Enter}');

      expect(await screen.findByText(NO_QUERY_LINE)).toBeInTheDocument();
      expect(currentSearch()).toBe('?type=tv');
      expect(requests).toEqual([]);
      expect(document.title).toBe('Search · CinePulse');
    });

    it('adds no history entry for the same query', async () => {
      mockSearch();
      const { user } = renderSearch('/search');
      await user.type(searchInput(), 'dune{Enter}');
      await screen.findByText('Film dune');

      await user.type(searchInput(), '{Enter}');
      await user.click(screen.getByRole('button', { name: 'Go back' }));

      expect(await screen.findByText(NO_QUERY_LINE)).toBeInTheDocument();
    });

    it('takes the value of q on Back and Forward', async () => {
      mockSearch();
      const { user } = renderSearch('/search?q=dune');
      await screen.findByText('Film dune');

      await user.clear(searchInput());
      await user.type(searchInput(), 'dark{Enter}');
      await screen.findByText('Film dark');
      await user.click(screen.getByRole('button', { name: 'Go back' }));

      expect(await screen.findByText('Film dune')).toBeInTheDocument();
      expect(searchInput()).toHaveValue('dune');
    });

    it('drops an unsent draft when the URL changes', async () => {
      mockSearch();
      const { user } = renderSearch('/search?q=dune');
      await screen.findByText('Film dune');

      await user.type(searchInput(), ' 2');
      await user.click(within(tabs()).getByRole('link', { name: 'TV Shows' }));

      expect(await screen.findByText('Show dune')).toBeInTheDocument();
      expect(searchInput()).toHaveValue('dune');
    });

    it('does not take focus when the page opens with a query', async () => {
      mockSearch();
      renderSearch('/search?q=dune');

      await screen.findByText('Film dune');

      expect(searchInput()).not.toHaveFocus();
    });
  });

  describe('the tabs', () => {
    it('are links that keep the query, and the active one is marked', async () => {
      mockSearch();
      renderSearch('/search?q=dune&type=tv');

      const links = within(tabs()).getAllByRole('link');
      expect(links.map((link) => link.textContent)).toEqual(['Movies', 'TV Shows', 'People']);
      expect(links.map((link) => link.getAttribute('href'))).toEqual([
        '/search?q=dune',
        '/search?q=dune&type=tv',
        '/search?q=dune&type=person',
      ]);
      expect(links.map((link) => link.getAttribute('aria-current'))).toEqual([null, 'page', null]);
      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
      await screen.findByText('Show dune');
    });

    it('count an unknown type as Movies', async () => {
      mockSearch();
      const requests = recordSearches();
      renderSearch('/search?q=dune&type=books');

      expect(await screen.findByText('Film dune')).toBeInTheDocument();
      expect(within(tabs()).getByRole('link', { name: 'Movies' })).toHaveAttribute(
        'aria-current',
        'page'
      );
      expect(requests).toEqual(['movie:dune']);
    });

    it('load only the active tab', async () => {
      mockSearch();
      const requests = recordSearches();
      const { user } = renderSearch('/search?q=dune');
      await screen.findByText('Film dune');

      await user.click(within(tabs()).getByRole('link', { name: 'People' }));

      expect(await screen.findByRole('link', { name: /Zendaya/ })).toBeInTheDocument();
      expect(screen.queryByText('Film dune')).not.toBeInTheDocument();
      expect(requests).toEqual(['movie:dune', 'person:dune']);
    });

    it('leave focus on the tab that was pressed', async () => {
      mockSearch();
      const { user } = renderSearch('/search?q=dune');
      await screen.findByText('Film dune');

      await user.click(within(tabs()).getByRole('link', { name: 'TV Shows' }));
      await screen.findByText('Show dune');

      expect(within(tabs()).getByRole('link', { name: 'TV Shows' })).toHaveFocus();
    });
  });

  describe('the results', () => {
    it('show movies as cards that lead to their page, with the watchlist', async () => {
      mockSearch();
      const { container } = renderSearch('/search?q=dune');

      expect(await screen.findByRole('link', { name: 'Film dune' })).toHaveAttribute(
        'href',
        '/movies/1'
      );
      expect(screen.getByRole('status')).toHaveTextContent('1 movie found');
      expect(
        screen.getByRole('button', { name: 'Add Film dune to your watchlist' })
      ).toBeInTheDocument();
      await expectNoA11yViolations(container);
    });

    it('show TV shows as cards that lead to their page, with the watchlist', async () => {
      mockSearch();
      const { container } = renderSearch('/search?q=dune&type=tv');

      expect(await screen.findByRole('link', { name: 'Show dune' })).toHaveAttribute(
        'href',
        '/tv/2'
      );
      expect(screen.getByRole('status')).toHaveTextContent('1 TV show found');
      expect(
        screen.getByRole('button', { name: 'Add Show dune to your watchlist' })
      ).toBeInTheDocument();
      await expectNoA11yViolations(container);
    });

    it('show people as cards that lead to their page, with no watchlist', async () => {
      mockSearch();
      const { container } = renderSearch('/search?q=zendaya&type=person');

      const link = await screen.findByRole('link', { name: /Zendaya/ });
      expect(link).toHaveAttribute('href', '/person/3');
      expect(link).toHaveTextContent('Acting');
      expect(screen.getByRole('status')).toHaveTextContent('1 person found');
      expect(screen.queryByRole('button', { name: /watchlist/ })).not.toBeInTheDocument();
      await expectNoA11yViolations(container);
    });

    it('render external text as text', async () => {
      const name = '<img src=x onerror=alert(1)>';
      mockSearch({
        person: () => HttpResponse.json(buildPaginated([buildPerson({ name })])),
      });
      const { container } = renderSearch('/search?q=a&type=person');

      expect(await screen.findByRole('heading', { level: 3, name })).toBeInTheDocument();
      expect(container.querySelector('img[src="x"]')).not.toBeInTheDocument();
    });

    it('send a query with reserved characters whole', async () => {
      mockSearch();
      const requests = recordSearches();
      const { user } = renderSearch();

      await user.type(searchInput(), 'fast & furious #9{Enter}');

      expect(await screen.findByText('Film fast & furious #9')).toBeInTheDocument();
      expect(requests).toEqual(['movie:fast & furious #9']);
    });
  });

  describe('Load more', () => {
    it('adds the next page and shows a title of both pages once', async () => {
      mockSearch({ movie: twoPages });
      const { user } = renderSearch('/search?q=dune');
      await screen.findByText('Only on page 1');

      await user.click(screen.getByRole('button', { name: 'Load more' }));

      expect(await screen.findByText('Only on page 2')).toBeInTheDocument();
      expect(screen.getAllByText('On both pages')).toHaveLength(1);
      expect(screen.getByText("That's all")).toBeInTheDocument();
    });

    it('pages people too', async () => {
      mockSearch({
        person: (params) => {
          const page = Number(params.get('page') ?? '1');
          return HttpResponse.json(
            buildPaginated([buildPerson({ id: page, name: `Person p${page}` })], {
              page,
              total_pages: 2,
              total_results: 2,
            })
          );
        },
      });
      const { user } = renderSearch('/search?q=a&type=person');
      await screen.findByRole('link', { name: /Person p1/ });

      await user.click(screen.getByRole('button', { name: 'Load more' }));

      expect(await screen.findByRole('link', { name: /Person p2/ })).toBeInTheDocument();
    });

    it('shows a failed next page inline and keeps what has loaded', async () => {
      let isDown = true;
      mockSearch({
        person: (params) => {
          const page = Number(params.get('page') ?? '1');
          if (page === 2 && isDown) return new HttpResponse(null, { status: 500 });
          return HttpResponse.json(
            buildPaginated([buildPerson({ id: page, name: `Person p${page}` })], {
              page,
              total_pages: 2,
              total_results: 2,
            })
          );
        },
      });
      const { user } = renderSearch('/search?q=a&type=person');
      await screen.findByRole('link', { name: /Person p1/ });

      await user.click(screen.getByRole('button', { name: 'Load more' }));

      expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load more people.");
      expect(screen.getByRole('link', { name: /Person p1/ })).toBeInTheDocument();

      isDown = false;
      await user.click(screen.getByRole('button', { name: 'Try again' }));

      expect(await screen.findByRole('link', { name: /Person p2/ })).toBeInTheDocument();
    });
  });

  describe('with no results', () => {
    const none = () => HttpResponse.json(buildPaginated([]));

    it('names the query and the tab', async () => {
      mockSearch({ movie: none, tv: none, person: none });
      const { user, container } = renderSearch('/search?q=dune&type=tv');

      expect(
        await screen.findByRole('heading', { name: 'No TV shows found for “dune”' })
      ).toBeInTheDocument();
      await expectNoA11yViolations(container);

      await user.click(within(tabs()).getByRole('link', { name: 'People' }));
      expect(
        await screen.findByRole('heading', { name: 'No people found for “dune”' })
      ).toBeInTheDocument();
      expect(screen.getByText('Check the spelling or try a different name.')).toBeInTheDocument();

      await user.click(within(tabs()).getByRole('link', { name: 'Movies' }));
      expect(
        await screen.findByRole('heading', { name: 'No movies found for “dune”' })
      ).toBeInTheDocument();
      expect(screen.getByText('Check the spelling or try a different title.')).toBeInTheDocument();
    });

    it('offers to clear the search and nothing about filters', async () => {
      mockSearch({ movie: none });
      const { user } = renderSearch('/search?q=dune&type=books');
      await screen.findByRole('heading', { name: 'No movies found for “dune”' });

      expect(screen.queryByRole('button', { name: 'Reset filters' })).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Clear search' }));

      expect(await screen.findByText(NO_QUERY_LINE)).toBeInTheDocument();
      expect(currentSearch()).toBe('?type=books');
      await waitFor(() => expect(searchInput()).toHaveFocus());
    });
  });

  describe('while results load', () => {
    const hang: Responder = async () => {
      await delay('infinite');
      return HttpResponse.json(buildPaginated([]));
    };

    it('shows the skeleton with the form and the tabs on screen', async () => {
      mockSearch({ movie: hang });
      renderSearch('/search?q=dune');

      expect(await screen.findByTestId('page-skeleton')).toHaveAttribute('aria-busy', 'true');
      expect(searchInput()).toHaveValue('dune');
      expect(tabs()).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1, name: 'Search' })).toBeInTheDocument();
    });

    it('replaces the results of the last tab with the skeleton', async () => {
      mockSearch({ tv: hang });
      const { user } = renderSearch('/search?q=dune');
      await screen.findByText('Film dune');

      await user.click(within(tabs()).getByRole('link', { name: 'TV Shows' }));

      expect(await screen.findByTestId('page-skeleton')).toBeInTheDocument();
      expect(screen.queryByText('Film dune')).not.toBeInTheDocument();
      expect(within(tabs()).getByRole('link', { name: 'TV Shows' })).toHaveAttribute(
        'aria-current',
        'page'
      );
    });
  });

  describe('on an error', () => {
    it('offers a retry that brings the results', async () => {
      let isDown = true;
      mockSearch({
        movie: () =>
          isDown
            ? new HttpResponse(null, { status: 500 })
            : HttpResponse.json(buildPaginated([buildMovie({ title: 'Back online' })])),
      });
      const { user, container } = renderSearch('/search?q=dune');

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'This section could not be loaded.'
      );
      await expectNoA11yViolations(container);

      isDown = false;
      await user.click(screen.getByRole('button', { name: 'Try again' }));

      expect(await screen.findByText('Back online')).toBeInTheDocument();
    });

    it('keeps the form usable, and a new search leaves the error behind', async () => {
      mockSearch({
        movie: (params) =>
          params.get('query') === 'dune'
            ? new HttpResponse(null, { status: 500 })
            : HttpResponse.json(buildPaginated([buildMovie({ title: 'Found it' })])),
      });
      const { user } = renderSearch('/search?q=dune');
      await screen.findByRole('alert');

      await user.clear(searchInput());
      await user.type(searchInput(), 'dark{Enter}');

      expect(await screen.findByText('Found it')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('leaves the error behind on another tab', async () => {
      mockSearch({ movie: () => new HttpResponse(null, { status: 500 }) });
      const { user } = renderSearch('/search?q=dune');
      await screen.findByRole('alert');

      await user.click(within(tabs()).getByRole('link', { name: 'TV Shows' }));

      expect(await screen.findByText('Show dune')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('reaches the error, not a crash, with a hand-typed q over the limit', async () => {
      const query = 'x'.repeat(101);
      const requests = recordSearches();
      mockSearch({ movie: () => new HttpResponse(null, { status: 400 }) });
      renderSearch(`/search?q=${query}`);

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'This section could not be loaded.'
      );
      expect(requests).toEqual([`movie:${query}`]);
      expect(searchInput()).toHaveValue(query);
      expect(document.title).toBe(`Search: ${query} · CinePulse`);
    });

    it('cuts a q over the limit on submit, so the form gets out of the error', async () => {
      const query = 'x'.repeat(101);
      mockSearch({
        movie: (params) =>
          (params.get('query') ?? '').length > 100
            ? new HttpResponse(null, { status: 400 })
            : HttpResponse.json(buildPaginated([buildMovie({ title: 'Within the limit' })])),
      });
      const { user } = renderSearch(`/search?q=${query}`);
      await screen.findByRole('alert');

      await user.click(screen.getByRole('button', { name: 'Search' }));

      expect(await screen.findByText('Within the limit')).toBeInTheDocument();
      expect(currentSearch()).toBe(`?q=${'x'.repeat(100)}`);
    });
  });
});
