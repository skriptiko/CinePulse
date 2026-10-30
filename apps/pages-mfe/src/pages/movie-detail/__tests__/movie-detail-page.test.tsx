import { ROUTE_PATHS } from '@repo/routes';
import {
  buildMovie,
  expectNoA11yViolations,
  renderWithProviders,
  screen,
  server,
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

describe('Movie Detail page', () => {
  beforeEach(() => {
    // React logs errors caught by boundaries; the tests assert the UI.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it('shows the movie', async () => {
    server.use(http.get('*/api/tmdb/movie/42', () => HttpResponse.json(DETAILS)));
    const { container } = renderPage('/movies/42');

    expect(await screen.findByRole('heading', { level: 1, name: 'Dune' })).toBeInTheDocument();
    expect(screen.getByText('A desert planet.')).toBeInTheDocument();
    expect(screen.getByText('2h 35m')).toBeInTheDocument();
    expect(screen.getByText('Sci-Fi')).toBeInTheDocument();
    expect(document.title).toBe('Dune · CinePulse');
    await expectNoA11yViolations(container);
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
