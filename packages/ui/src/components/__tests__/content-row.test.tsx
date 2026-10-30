import { renderWithProviders, screen, within } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { ContentRow } from '../content-row';
import type { MovieCardData } from '../movie-card';

const MOVIES: MovieCardData[] = [
  { id: 1, title: 'Dune', imageUrl: null, year: '2021', rating: '7.8', href: null },
  { id: 2, title: 'Arrival', imageUrl: null, year: '2016', rating: '7.6', href: null },
];

describe('ContentRow', () => {
  it('renders the title and a card per movie', () => {
    renderWithProviders(<ContentRow title="Trending Now" movies={MOVIES} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Trending Now' })).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
    ).toEqual(['Dune', 'Arrival']);
  });

  it('offers no action without a destination', () => {
    renderWithProviders(<ContentRow title="Trending Now" movies={MOVIES} />);

    expect(screen.queryByRole('button', { name: 'See all' })).not.toBeInTheDocument();
  });

  it('keeps the carousel arrows out of the Tab order and the accessibility tree', () => {
    const { container } = renderWithProviders(<ContentRow title="Trending Now" movies={MOVIES} />);

    const arrows = container.querySelectorAll('button[tabindex="-1"][aria-hidden="true"]');
    expect(arrows).toHaveLength(2);
  });

  it('is a region named by its heading, with the cards in a list', () => {
    renderWithProviders(<ContentRow title="Trending Now" movies={MOVIES} />);

    const region = screen.getByRole('region', { name: 'Trending Now' });
    expect(within(region).getAllByRole('listitem')).toHaveLength(2);
  });
});
