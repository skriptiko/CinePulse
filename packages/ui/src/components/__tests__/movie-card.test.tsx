import { expectNoA11yViolations, renderWithProviders, screen } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { MovieCard, type MovieCardData } from '../movie-card';

const MOVIE: MovieCardData = {
  id: 1,
  title: 'Dune',
  mediaType: 'movie',
  posterPath: '/dune.jpg',
  imageUrl: 'https://image.tmdb.org/t/p/w342/dune.jpg',
  year: '2021',
  rating: '7.8',
  href: '/movies/1',
};

describe('MovieCard', () => {
  it('renders the model', () => {
    const { container } = renderWithProviders(<MovieCard movie={MOVIE} />);

    expect(screen.getByRole('heading', { name: 'Dune' })).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('src', MOVIE.imageUrl);
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
    expect(screen.getByText('7.8')).toBeInTheDocument();
    expect(screen.getByText('2021')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dune/ })).toHaveAttribute('href', '/movies/1');
  });

  it('reveals the overlay for keyboard users too', () => {
    const { container } = renderWithProviders(<MovieCard movie={MOVIE} />);

    expect(container.querySelector('.group-focus-within\\:opacity-100')).not.toBeNull();
  });

  it('shows the title, year and rating at rest on a coarse pointer', () => {
    const { container } = renderWithProviders(<MovieCard movie={MOVIE} />);

    for (const text of ['Dune', '2021']) {
      const reveal = screen.getByText(text).closest('.opacity-0');
      expect(reveal).toHaveClass('pointer-coarse:opacity-100', 'pointer-coarse:translate-y-0');
    }
    expect(container.querySelector('.bg-linear-to-t')).toHaveClass('pointer-coarse:opacity-100');
  });

  it('lifts the card and zooms the image for a fine pointer only', () => {
    const { container } = renderWithProviders(<MovieCard movie={MOVIE} />);

    expect(container.firstElementChild).toHaveClass('pointer-fine:motion-safe:hover:scale-105');
    expect(container.querySelector('img')).toHaveClass(
      'pointer-fine:motion-safe:group-hover:scale-110'
    );
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

  it('keeps an action outside the link, as interactive content cannot nest in one', () => {
    renderWithProviders(<MovieCard movie={MOVIE} action={<button type="button">Add</button>} />);

    const button = screen.getByRole('button', { name: 'Add' });
    expect(button.closest('a')).toBeNull();
    expect(screen.getByRole('link', { name: 'Dune' })).toHaveClass('after:absolute');
  });

  it('has no positioned or transformed ancestor between the link and the card', () => {
    renderWithProviders(<MovieCard movie={MOVIE} />);

    const link = screen.getByRole('link', { name: 'Dune' });
    let element = link.parentElement;
    while (element !== null && !element.classList.contains('group')) {
      expect(element.className).not.toMatch(/\b(relative|absolute|translate|transform)/);
      element = element.parentElement;
    }
  });

  it('lets a press on the metadata through to the link', () => {
    renderWithProviders(<MovieCard movie={MOVIE} />);

    expect(screen.getByText('2021').closest('.pointer-events-none')).not.toBeNull();
  });

  it('names its poster for the page transition when opened with a plain click', async () => {
    const { container, user } = renderWithProviders(<MovieCard movie={MOVIE} />);

    await user.click(screen.getByRole('link', { name: 'Dune' }));

    expect(container.querySelector('[data-opened-poster]')).toContainElement(
      container.querySelector('img')
    );
  });

  it('leaves its poster unnamed when a modifier opens another tab', async () => {
    const { container, user } = renderWithProviders(<MovieCard movie={MOVIE} />);

    await user.keyboard('{Control>}');
    await user.click(screen.getByRole('link', { name: 'Dune' }));
    await user.keyboard('{/Control}');

    expect(container.querySelector('[data-opened-poster]')).toBeNull();
  });

  it('renders no control without an action', () => {
    renderWithProviders(<MovieCard movie={MOVIE} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('has no structural a11y violations', async () => {
    const { container } = renderWithProviders(<MovieCard movie={MOVIE} />);

    await expectNoA11yViolations(container);
  });
});
