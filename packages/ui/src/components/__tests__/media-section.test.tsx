import { expectNoA11yViolations, render, screen, within } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { type MediaData, MediaSection } from '../media-section';

const MEDIA: MediaData = {
  videos: [
    {
      id: 'v1',
      title: 'Official Trailer',
      url: 'https://www.youtube.com/watch?v=abc',
      thumbnailUrl: 'https://i.ytimg.com/vi/abc/hqdefault.jpg',
    },
  ],
  images: [
    {
      id: '/one.jpg',
      thumbnailUrl: 'https://image.tmdb.org/t/p/w780/one.jpg',
      url: 'https://image.tmdb.org/t/p/original/one.jpg',
      alt: 'Dune, image 1',
    },
  ],
};

describe('MediaSection', () => {
  it('is a region named by its heading', () => {
    render(<MediaSection media={MEDIA} />);

    expect(screen.getByRole('region', { name: 'Videos and images' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Videos and images' })
    ).toBeInTheDocument();
  });

  it('opens a video on YouTube in a new tab, with no iframe', () => {
    const { container } = render(<MediaSection media={MEDIA} />);

    const link = screen.getByRole('link', { name: /Official Trailer/ });
    expect(link).toHaveAttribute('href', 'https://www.youtube.com/watch?v=abc');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(container.querySelector('iframe')).not.toBeInTheDocument();
  });

  it('shows the thumbnail of a video', () => {
    render(<MediaSection media={MEDIA} />);

    const link = screen.getByRole('link', { name: /Official Trailer/ });
    expect(link.querySelector('img')).toHaveAttribute(
      'src',
      'https://i.ytimg.com/vi/abc/hqdefault.jpg'
    );
  });

  it('shows a lazy image that opens the original in a new tab', () => {
    render(<MediaSection media={MEDIA} />);

    const image = screen.getByRole('img', { name: 'Dune, image 1' });
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w780/one.jpg');

    const link = screen.getByRole('link', { name: /Dune, image 1/ });
    expect(link).toHaveAttribute('href', 'https://image.tmdb.org/t/p/original/one.jpg');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows what exists when one of the two is missing', () => {
    render(<MediaSection media={{ ...MEDIA, images: [] }} />);

    expect(screen.getByRole('link', { name: /Official Trailer/ })).toBeInTheDocument();
    expect(screen.queryByText('No videos or images yet.')).not.toBeInTheDocument();
  });

  it('renders the heading and one line when it is empty', () => {
    render(<MediaSection media={{ videos: [], images: [] }} />);

    const region = screen.getByRole('region', { name: 'Videos and images' });
    expect(within(region).getByText('No videos or images yet.')).toBeInTheDocument();
    expect(within(region).queryByRole('list')).not.toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<MediaSection media={MEDIA} />);

    await expectNoA11yViolations(container);
  });
});
