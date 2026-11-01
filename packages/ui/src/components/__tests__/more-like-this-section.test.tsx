import { expectNoA11yViolations, renderWithProviders, screen, within } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { MoreLikeThisSection } from '../more-like-this-section';
import type { MovieCardData } from '../movie-card';

const TITLE: MovieCardData = {
  id: 1,
  title: 'Arrival',
  mediaType: 'movie',
  posterPath: null,
  imageUrl: null,
  year: '2016',
  rating: '7.6',
  href: '/movies/1',
};

describe('MoreLikeThisSection', () => {
  it('shows the titles as a row of cards', () => {
    renderWithProviders(<MoreLikeThisSection titles={[TITLE]} />);

    const region = screen.getByRole('region', { name: 'More like this' });
    expect(
      within(region).getByRole('heading', { level: 2, name: 'More like this' })
    ).toBeInTheDocument();
    expect(within(region).getByRole('link', { name: 'Arrival' })).toHaveAttribute(
      'href',
      '/movies/1'
    );
  });

  it('gives each card its action', () => {
    renderWithProviders(
      <MoreLikeThisSection
        titles={[TITLE]}
        renderCardAction={(title) => <button type="button">Add {title.title}</button>}
      />
    );

    expect(screen.getByRole('button', { name: 'Add Arrival' })).toBeInTheDocument();
  });

  it('renders the heading and one line when it is empty', () => {
    renderWithProviders(<MoreLikeThisSection titles={[]} />);

    const region = screen.getByRole('region', { name: 'More like this' });
    expect(within(region).getByText('No similar titles yet.')).toBeInTheDocument();
    expect(within(region).queryByRole('list')).not.toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = renderWithProviders(<MoreLikeThisSection titles={[TITLE]} />);

    await expectNoA11yViolations(container);
  });
});
