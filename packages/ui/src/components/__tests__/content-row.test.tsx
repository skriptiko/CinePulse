import { renderWithProviders, screen } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { ContentRow } from '../content-row';
import type { MovieCardData } from '../movie-card';

const MOVIES: MovieCardData[] = [
  { id: 1, title: 'Dune', imageUrl: null, year: '2021', rating: '7.8' },
  { id: 2, title: 'Arrival', imageUrl: null, year: '2016', rating: '7.6' },
];

describe('ContentRow', () => {
  it('renders the title and a card per movie', () => {
    renderWithProviders(<ContentRow title="Trending Now" movies={MOVIES} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Trending Now' })).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
    ).toEqual(['Dune', 'Arrival']);
  });
});
