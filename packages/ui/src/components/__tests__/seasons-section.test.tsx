import { expectNoA11yViolations, render, screen, within } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { type SeasonData, SeasonsSection } from '../seasons-section';

const SEASON: SeasonData = {
  id: 1,
  name: 'Season 1',
  posterUrl: 'https://image.tmdb.org/t/p/w185/season-1.jpg',
  year: '2022',
  episodes: '9 episodes',
  overview: 'Mark leads a team of office workers.',
};

describe('SeasonsSection', () => {
  it('is a region named by its heading', () => {
    render(<SeasonsSection seasons={[SEASON]} />);

    const region = screen.getByRole('region', { name: 'Seasons' });
    expect(within(region).getByRole('heading', { level: 2, name: 'Seasons' })).toBeInTheDocument();
  });

  it('shows the name, air year, episode count and overview of each season', () => {
    render(<SeasonsSection seasons={[SEASON, { ...SEASON, id: 2, name: 'Season 2' }]} />);

    const [first] = screen.getAllByRole('listitem');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(
      within(first as HTMLElement).getByRole('heading', { level: 3, name: 'Season 1' })
    ).toBeInTheDocument();
    expect(first).toHaveTextContent('2022');
    expect(first).toHaveTextContent('9 episodes');
    expect(first).toHaveTextContent('Mark leads a team of office workers.');
  });

  it('shows the poster, or a placeholder without one', () => {
    const { container } = render(
      <SeasonsSection seasons={[SEASON, { ...SEASON, id: 2, posterUrl: null }]} />
    );
    const [withPoster, withoutPoster] = screen.getAllByRole('listitem');

    expect(container.querySelectorAll('img')).toHaveLength(1);
    expect(container.querySelector('img')).toHaveAttribute('src', SEASON.posterUrl);
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy');
    expect(withPoster?.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(withoutPoster?.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('clamps a long overview and lets an unbroken word wrap', () => {
    render(<SeasonsSection seasons={[SEASON]} />);

    expect(screen.getByText('Mark leads a team of office workers.')).toHaveClass(
      'line-clamp-3',
      'wrap-anywhere'
    );
  });

  it('leaves out what TMDB does not know', () => {
    render(
      <SeasonsSection seasons={[{ ...SEASON, year: null, episodes: null, overview: null }]} />
    );

    const item = screen.getByRole('listitem');
    expect(within(item).getByRole('heading', { name: 'Season 1' })).toBeInTheDocument();
    expect(item.querySelectorAll('p')).toHaveLength(0);
  });

  it('keeps the rest of the line when one part is missing', () => {
    render(<SeasonsSection seasons={[{ ...SEASON, year: null }]} />);

    expect(screen.getByText('9 episodes')).toBeInTheDocument();
  });

  it('renders the heading and one line when it is empty', () => {
    render(<SeasonsSection seasons={[]} />);

    const region = screen.getByRole('region', { name: 'Seasons' });
    expect(within(region).getByText('No seasons listed.')).toBeInTheDocument();
    expect(within(region).queryByRole('list')).not.toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<SeasonsSection seasons={[SEASON]} />);

    await expectNoA11yViolations(container);
  });
});
