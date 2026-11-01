import { expectNoA11yViolations, renderWithProviders, screen, within } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { CastSection, type CreditsData } from '../cast-section';

const CREDITS: CreditsData = {
  cast: [
    {
      creditId: 'a',
      name: 'Zendaya',
      character: 'Chani',
      photoUrl: 'https://image.tmdb.org/t/p/w185/zendaya.jpg',
      href: '/person/1',
    },
    {
      creditId: 'b',
      name: 'Timothée Chalamet',
      character: null,
      photoUrl: null,
      href: '/person/2',
    },
  ],
  crew: [{ id: 3, name: 'Denis Villeneuve', jobs: 'Director, Screenplay', href: '/person/3' }],
};

describe('CastSection', () => {
  it('is a region named by its heading', () => {
    renderWithProviders(<CastSection credits={CREDITS} />);

    const region = screen.getByRole('region', { name: 'Cast' });
    expect(within(region).getByRole('heading', { level: 2, name: 'Cast' })).toBeInTheDocument();
  });

  it('links each cast member to their page, with the name and the character', () => {
    renderWithProviders(<CastSection credits={CREDITS} />);

    expect(screen.getByRole('link', { name: /Zendaya/ })).toHaveAttribute('href', '/person/1');
    expect(screen.getByRole('link', { name: /Zendaya/ })).toHaveTextContent('Chani');
  });

  it('shows the photo, or a placeholder without one', () => {
    const { container } = renderWithProviders(<CastSection credits={CREDITS} />);

    expect(container.querySelectorAll('img')).toHaveLength(1);
    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy');
    expect(
      screen.getByRole('link', { name: 'Timothée Chalamet' }).querySelector('[aria-hidden="true"]')
    ).toBeInTheDocument();
  });

  it('links directors and writers to their pages, each with their jobs', () => {
    renderWithProviders(<CastSection credits={CREDITS} />);

    const line = screen.getByRole('list', { name: 'Directors and writers' });
    expect(within(line).getByRole('link', { name: 'Denis Villeneuve' })).toHaveAttribute(
      'href',
      '/person/3'
    );
    expect(line).toHaveTextContent('Director, Screenplay');
  });

  it('keeps the crew and says so when only the cast is missing', () => {
    renderWithProviders(<CastSection credits={{ ...CREDITS, cast: [] }} />);

    expect(screen.getByRole('link', { name: 'Denis Villeneuve' })).toBeInTheDocument();
    expect(screen.getByText('No cast listed yet.')).toBeInTheDocument();
  });

  it('renders the heading and one line when it is empty', () => {
    renderWithProviders(<CastSection credits={{ cast: [], crew: [] }} />);

    const region = screen.getByRole('region', { name: 'Cast' });
    expect(within(region).getByText('No cast listed yet.')).toBeInTheDocument();
    expect(within(region).queryByRole('list')).not.toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = renderWithProviders(<CastSection credits={CREDITS} />);

    await expectNoA11yViolations(container);
  });
});
