import { ROUTE_PATHS } from '@repo/routes';
import { renderWithProviders, screen, server } from '@repo/test-utils';
import { HttpResponse, http } from 'msw';
import { useRoutes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { routes } from '../routes';

function App() {
  return useRoutes(routes);
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
});
