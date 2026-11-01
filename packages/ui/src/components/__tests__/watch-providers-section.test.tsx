import { expectNoA11yViolations, render, screen, within } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { type WatchProvidersData, WatchProvidersSection } from '../watch-providers-section';

const LINK = 'https://www.themoviedb.org/movie/42/watch?locale=UA';

const PROVIDERS: WatchProvidersData = {
  country: 'Ukraine',
  link: LINK,
  groups: [
    {
      label: 'Stream',
      providers: [
        { id: 1, name: 'Netflix', logoUrl: 'https://image.tmdb.org/t/p/w92/netflix.png' },
        { id: 2, name: 'Megogo', logoUrl: null },
      ],
    },
    { label: 'Rent', providers: [{ id: 3, name: 'Apple TV', logoUrl: null }] },
  ],
};

describe('WatchProvidersSection', () => {
  it('is a region named by its heading', () => {
    render(<WatchProvidersSection providers={PROVIDERS} />);

    expect(screen.getByRole('region', { name: 'Where to watch' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Where to watch' })).toBeInTheDocument();
  });

  it('shows each group with its providers, by logo and name', () => {
    const { container } = render(<WatchProvidersSection providers={PROVIDERS} />);

    const stream = screen.getByRole('list', { name: 'Stream' });
    expect(within(stream).getAllByRole('listitem')).toHaveLength(2);
    expect(within(stream).getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Rent' })).toHaveTextContent('Apple TV');
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://image.tmdb.org/t/p/w92/netflix.png'
    );
  });

  it('links to the TMDB page in a new tab', () => {
    render(<WatchProvidersSection providers={PROVIDERS} />);

    const link = screen.getByRole('link', { name: /TMDB/ });
    expect(link).toHaveAttribute('href', LINK);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('credits JustWatch, as the terms of TMDB require', () => {
    render(<WatchProvidersSection providers={PROVIDERS} />);

    expect(screen.getByText('Streaming data by JustWatch')).toBeInTheDocument();
  });

  it('keeps the providers and the credit when the link is unusable', () => {
    render(<WatchProvidersSection providers={{ ...PROVIDERS, link: null }} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Streaming data by JustWatch')).toBeInTheDocument();
  });

  it('renders the heading and one line naming the country when it is empty', () => {
    render(<WatchProvidersSection providers={{ country: 'Ukraine', link: null, groups: [] }} />);

    const region = screen.getByRole('region', { name: 'Where to watch' });
    expect(
      within(region).getByText('No streaming, rental or purchase options listed for Ukraine.')
    ).toBeInTheDocument();
    expect(within(region).queryByRole('list')).not.toBeInTheDocument();
    expect(within(region).queryByText('Streaming data by JustWatch')).not.toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<WatchProvidersSection providers={PROVIDERS} />);

    await expectNoA11yViolations(container);
  });
});
