import { renderWithProviders, screen } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { Hero, type HeroData } from '../hero';

const MOVIE: HeroData = {
  id: 1,
  title: 'Dune',
  description: 'A desert planet.',
  imageUrl: 'https://image.tmdb.org/t/p/w1280/dune-bg.jpg',
  year: '2021',
  rating: '7.8',
};

describe('Hero', () => {
  it('renders the model', () => {
    renderWithProviders(<Hero movie={MOVIE} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Dune' })).toBeInTheDocument();
    expect(screen.getByText('A desert planet.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Dune' })).toHaveAttribute('src', MOVIE.imageUrl);
    expect(screen.getByText('7.8')).toBeInTheDocument();
    expect(screen.getByText('2021')).toBeInTheDocument();
  });

  it('falls back to a placeholder and hides empty fields', () => {
    renderWithProviders(
      <Hero movie={{ ...MOVIE, description: null, imageUrl: null, rating: null, year: null }} />
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Dune' })).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText('A desert planet.')).not.toBeInTheDocument();
    expect(screen.queryByText('7.8')).not.toBeInTheDocument();
  });
});
