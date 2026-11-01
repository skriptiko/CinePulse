import { render, screen } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { type MovieDetailData, MovieDetailView } from '../movie-detail-view';

const MOVIE: MovieDetailData = {
  title: 'Dune',
  tagline: null,
  description: 'A desert planet.',
  posterUrl: null,
  backdropUrl: null,
  backdropSrcSet: null,
  year: '2021',
  rating: '7.8',
  duration: '2h 35m',
  genres: ['Sci-Fi'],
};

describe('MovieDetailView', () => {
  it('renders the hero alone with no sections', () => {
    render(<MovieDetailView movie={MOVIE} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Dune' })).toBeInTheDocument();
    expect(screen.getByRole('article').children).toHaveLength(1);
  });

  it('renders the sections below the hero block', () => {
    render(
      <MovieDetailView movie={MOVIE}>
        <p>A section</p>
      </MovieDetailView>
    );

    const heading = screen.getByRole('heading', { level: 1, name: 'Dune' });
    const section = screen.getByText('A section');
    expect(heading.compareDocumentPosition(section)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByRole('article').children).toHaveLength(2);
  });
});
