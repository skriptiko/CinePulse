import { expectNoA11yViolations, renderWithProviders, screen } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { MovieCard, type MovieCardData } from '../movie-card';

const MOVIE: MovieCardData = {
  id: 1,
  title: 'Dune',
  imageUrl: 'https://image.tmdb.org/t/p/w342/dune.jpg',
  year: '2021',
  rating: '7.8',
};

describe('MovieCard', () => {
  it('renders the model', () => {
    const { container } = renderWithProviders(<MovieCard movie={MOVIE} />);

    expect(screen.getByRole('heading', { name: 'Dune' })).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('src', MOVIE.imageUrl);
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
    expect(screen.getByText('7.8')).toBeInTheDocument();
    expect(screen.getByText('2021')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play Dune' })).toBeInTheDocument();
  });

  it('reveals the overlay for keyboard users too', () => {
    const { container } = renderWithProviders(<MovieCard movie={MOVIE} />);

    expect(container.querySelector('.group-focus-within\\:opacity-100')).not.toBeNull();
  });

  it('does not look clickable without an action of its own', () => {
    const { container } = renderWithProviders(<MovieCard movie={MOVIE} />);

    expect(container.firstElementChild).not.toHaveClass('cursor-pointer');
  });

  it('shows a placeholder instead of an image when there is none', () => {
    const { container } = renderWithProviders(<MovieCard movie={{ ...MOVIE, imageUrl: null }} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });

  it('hides a missing rating and year but keeps a rating of 0', () => {
    const { rerender } = renderWithProviders(
      <MovieCard movie={{ ...MOVIE, rating: null, year: null }} />
    );

    expect(screen.queryByText('7.8')).not.toBeInTheDocument();
    expect(screen.queryByText('2021')).not.toBeInTheDocument();

    rerender(<MovieCard movie={{ ...MOVIE, rating: '0.0' }} />);

    expect(screen.getByText('0.0')).toBeInTheDocument();
  });

  it('has no "add to list" toggle until a watchlist exists', () => {
    renderWithProviders(<MovieCard movie={MOVIE} />);

    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('has no structural a11y violations', async () => {
    const { container } = renderWithProviders(<MovieCard movie={MOVIE} />);

    await expectNoA11yViolations(container);
  });
});
