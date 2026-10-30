import { expectNoA11yViolations, renderWithProviders, screen, within } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { FeaturedGrid, type FeaturedItemData } from '../featured-grid';

const ITEMS: FeaturedItemData[] = [
  {
    id: 1,
    title: 'Dune',
    imageUrl: 'https://image.tmdb.org/d.jpg',
    year: '2021',
    rating: '7.8',
    genre: 'Sci-Fi',
    href: '/movies/1',
  },
  {
    id: 2,
    title: 'Arrival',
    imageUrl: null,
    year: '2016',
    rating: '7.6',
    genre: null,
    href: '/movies/2',
  },
];

describe('FeaturedGrid', () => {
  it('is a region named by its heading, with the tiles in a list', () => {
    renderWithProviders(<FeaturedGrid title="Editor's Picks" items={ITEMS} />);

    const region = screen.getByRole('region', { name: "Editor's Picks" });
    expect(within(region).getAllByRole('listitem')).toHaveLength(2);
  });

  it('treats posters as decorative next to the visible title', () => {
    const { container } = renderWithProviders(<FeaturedGrid title="Picks" items={ITEMS} />);

    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('does not look clickable without an action of its own', () => {
    renderWithProviders(<FeaturedGrid title="Picks" items={ITEMS} />);

    expect(screen.getAllByRole('listitem')[0]).not.toHaveClass('cursor-pointer');
  });

  it('links each tile to its details page', () => {
    renderWithProviders(<FeaturedGrid title="Picks" items={ITEMS} />);

    expect(screen.getByRole('link', { name: /Dune/ })).toHaveAttribute('href', '/movies/1');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<FeaturedGrid title="Picks" items={ITEMS} />);

    await expectNoA11yViolations(container);
  });
});
