import {
  buildMovie,
  buildPaginated,
  renderWithProviders,
  screen,
  server,
  within,
} from '@repo/test-utils';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Home } from '../home-page';

const TMDB = '*/api/tmdb';

function mockHome({ failingCategory }: { failingCategory?: string } = {}) {
  server.use(
    http.get(`${TMDB}/genre/movie/list`, () =>
      HttpResponse.json({ genres: [{ id: 28, name: 'Action' }] })
    ),
    http.get(`${TMDB}/trending/movie/day`, () =>
      HttpResponse.json(
        buildPaginated([{ ...buildMovie({ title: 'Trending hit' }), media_type: 'movie' }])
      )
    ),
    http.get(`${TMDB}/movie/:category`, ({ params }) =>
      params.category === failingCategory
        ? new HttpResponse(null, { status: 500 })
        : HttpResponse.json(buildPaginated([buildMovie({ title: `${params.category} movie` })]))
    )
  );
}

describe('Home', () => {
  beforeEach(() => {
    // React logs errors caught by boundaries; the tests assert the UI.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it('uses the app name as the document title', async () => {
    document.title = 'Previous page';
    mockHome();
    renderWithProviders(<Home />);

    await screen.findByRole('heading', { level: 1 });

    expect(document.title).toBe('CinePulse');
  });

  it('renders every section from its own request', async () => {
    mockHome();
    renderWithProviders(<Home />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Popular' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'New Releases' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Trending Now' })).toBeInTheDocument();
  });

  it('keeps the page when one row fails', async () => {
    mockHome({ failingCategory: 'upcoming' });
    renderWithProviders(<Home />);

    expect(await screen.findByRole('alert')).toHaveTextContent('This section could not be loaded.');
    expect(await screen.findByRole('heading', { name: 'Popular' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'New Releases' })).not.toBeInTheDocument();
  });

  it('links each genre to Movies filtered by it', async () => {
    mockHome();
    renderWithProviders(<Home />);

    const genres = await screen.findByRole('navigation', { name: 'Browse by genre' });
    expect(within(genres).getByRole('link', { name: 'Action' })).toHaveAttribute(
      'href',
      '/movies?genre=28'
    );
    expect(within(genres).getByRole('link', { name: 'All' })).toHaveAttribute('href', '/movies');
  });
});
