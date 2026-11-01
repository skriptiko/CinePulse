import { expectNoA11yViolations, render, screen, within } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { type ReviewData, ReviewsSection } from '../reviews-section';

const REVIEW: ReviewData = {
  id: 'r1',
  author: 'garethmb',
  rating: '8.0',
  date: 'Mar 15, 2024',
  text: 'A *great* film.\n\n<script>alert(1)</script>',
  url: 'https://www.themoviedb.org/review/r1',
};

describe('ReviewsSection', () => {
  it('is a region named by its heading', () => {
    render(<ReviewsSection reviews={[REVIEW]} />);

    expect(screen.getByRole('region', { name: 'Reviews' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Reviews' })).toBeInTheDocument();
  });

  it('shows the author, rating and date', () => {
    render(<ReviewsSection reviews={[REVIEW]} />);

    expect(screen.getByText('garethmb')).toBeInTheDocument();
    expect(screen.getByText('8.0/10')).toBeInTheDocument();
    expect(screen.getByText('Mar 15, 2024')).toBeInTheDocument();
  });

  it('leaves the rating and date out when they are missing', () => {
    render(<ReviewsSection reviews={[{ ...REVIEW, rating: null, date: null }]} />);

    expect(screen.getByText('garethmb')).toBeInTheDocument();
    expect(screen.queryByText(/\/10/)).not.toBeInTheDocument();
  });

  it('renders the text as plain text, with no markdown or markup', () => {
    const { container } = render(<ReviewsSection reviews={[REVIEW]} />);

    expect(screen.getByText(/A \*great\* film\./)).toHaveTextContent('<script>alert(1)</script>');
    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(container.querySelector('em')).not.toBeInTheDocument();
  });

  it('clamps the text', () => {
    render(<ReviewsSection reviews={[REVIEW]} />);

    expect(screen.getByText(/A \*great\* film\./)).toHaveClass('line-clamp-6');
  });

  it('links to the full review in a new tab, named by its author', () => {
    render(<ReviewsSection reviews={[REVIEW]} />);

    const link = screen.getByRole('link', { name: /Read the full review by garethmb/ });
    expect(link).toHaveAttribute('href', 'https://www.themoviedb.org/review/r1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows the review without a link when TMDB gave no usable one', () => {
    render(<ReviewsSection reviews={[{ ...REVIEW, url: null }]} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders the heading and one line when it is empty', () => {
    render(<ReviewsSection reviews={[]} />);

    const region = screen.getByRole('region', { name: 'Reviews' });
    expect(within(region).getByText('No reviews yet.')).toBeInTheDocument();
    expect(within(region).queryByRole('list')).not.toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<ReviewsSection reviews={[REVIEW]} />);

    await expectNoA11yViolations(container);
  });
});
