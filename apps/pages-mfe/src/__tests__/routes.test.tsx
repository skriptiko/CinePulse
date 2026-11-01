import { buildPath, ROUTE_PATHS } from '@repo/routes';
import {
  buildPaginated,
  buildTv,
  buildTvDetails,
  renderWithProviders,
  screen,
  server,
} from '@repo/test-utils';
import { delay, HttpResponse, http } from 'msw';
import { Link, useRoutes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { routes } from '../routes';

function App() {
  return useRoutes(routes);
}

function AppWithLinks() {
  return (
    <>
      <Link to={ROUTE_PATHS.MOVIES}>To Movies</Link>
      <Link to={ROUTE_PATHS.TV}>To TV Shows</Link>
      <App />
    </>
  );
}

describe('routes', () => {
  beforeEach(() => {
    server.use(
      http.get('*/api/tmdb/*', () =>
        HttpResponse.json({ genres: [], results: [], total_results: 0 })
      )
    );
  });

  it('loads the Movies page on demand', async () => {
    renderWithProviders(<App />, { route: ROUTE_PATHS.MOVIES });

    expect(await screen.findByRole('heading', { level: 1, name: 'Movies' })).toBeInTheDocument();
  });

  it('loads the Home page on demand', async () => {
    renderWithProviders(<App />, { route: ROUTE_PATHS.HOME });

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('CinePulse');
  });

  it('loads the TV Shows page on demand', async () => {
    renderWithProviders(<App />, { route: ROUTE_PATHS.TV });

    expect(await screen.findByRole('heading', { level: 1, name: 'TV Shows' })).toBeInTheDocument();
  });

  it('loads the TV Detail page on demand', async () => {
    server.use(
      http.get('*/api/tmdb/tv/7', () =>
        HttpResponse.json(buildTvDetails({ id: 7, name: 'Severance' }))
      )
    );
    renderWithProviders(<App />, { route: buildPath.tv(7) });

    expect(await screen.findByRole('heading', { level: 1, name: 'Severance' })).toBeInTheDocument();
  });

  it('shows the details skeleton while a show loads', async () => {
    server.use(
      http.get('*/api/tmdb/tv/7', async () => {
        await delay('infinite');
        return HttpResponse.json(buildTvDetails());
      })
    );
    renderWithProviders(<App />, { route: buildPath.tv(7) });

    expect(await screen.findByTestId('page-skeleton')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('shows the TV Shows skeleton while the first page loads', async () => {
    server.use(
      http.get('*/api/tmdb/discover/tv', async () => {
        await delay('infinite');
        return HttpResponse.json(buildPaginated([]));
      })
    );
    renderWithProviders(<App />, { route: ROUTE_PATHS.TV });

    expect(await screen.findByTestId('page-skeleton')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('shows an error with a retry when the first page of TV Shows fails', async () => {
    let isDown = true;
    server.use(
      http.get('*/api/tmdb/discover/tv', () =>
        isDown
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(buildPaginated([buildTv({ name: 'Back online' })]))
      )
    );
    const { user } = renderWithProviders(<App />, { route: ROUTE_PATHS.TV });

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');

    isDown = false;
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Back online')).toBeInTheDocument();
  });

  it('shows the same error when the TV genres fail', async () => {
    server.use(http.get('*/api/tmdb/genre/tv/list', () => new HttpResponse(null, { status: 500 })));
    renderWithProviders(<App />, { route: ROUTE_PATHS.TV });

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
  });

  it('leaves no search text behind between Movies and TV Shows', async () => {
    const { user } = renderWithProviders(<AppWithLinks />, { route: ROUTE_PATHS.MOVIES });

    await user.type(await screen.findByRole('searchbox', { name: 'Search movies' }), 'dune');
    await user.click(screen.getByRole('link', { name: 'To TV Shows' }));

    expect(await screen.findByRole('searchbox', { name: 'Search TV shows' })).toHaveValue('');
  });
});
