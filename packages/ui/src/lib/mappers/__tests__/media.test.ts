import type { MediaImage, Video } from '@repo/api';
import { describe, expect, it } from 'vitest';
import { toMediaData } from '../media';

function video(overrides: Partial<Video> = {}): Video {
  return {
    id: 'video-1',
    key: 'abc123',
    name: 'Official Trailer',
    site: 'YouTube',
    type: 'Trailer',
    official: true,
    ...overrides,
  };
}

function backdrop(path: string): MediaImage {
  return { file_path: path, width: 3840, height: 2160 };
}

function toVideos(results: Video[]) {
  return toMediaData({ title: 'Dune', videos: { results } }).videos;
}

describe('toMediaData: videos', () => {
  it('links to YouTube with its thumbnail', () => {
    expect(toVideos([video()])).toEqual([
      {
        id: 'video-1',
        title: 'Official Trailer',
        url: 'https://www.youtube.com/watch?v=abc123',
        thumbnailUrl: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
      },
    ]);
  });

  it('encodes the key, which is external data', () => {
    const [first] = toVideos([video({ key: 'a&b=c/../d e' })]);

    expect(first?.url).toBe('https://www.youtube.com/watch?v=a%26b%3Dc%2F..%2Fd%20e');
    expect(first?.thumbnailUrl).toBe('https://i.ytimg.com/vi/a%26b%3Dc%2F..%2Fd%20e/hqdefault.jpg');
  });

  it('keeps YouTube trailers and teasers only', () => {
    const titles = toVideos([
      video({ id: '1', name: 'Vimeo trailer', site: 'Vimeo' }),
      video({ id: '2', name: 'A clip', type: 'Clip' }),
      video({ id: '3', name: 'Behind the scenes', type: 'Behind the Scenes' }),
      video({ id: '4', name: 'The trailer' }),
    ]).map((item) => item.title);

    expect(titles).toEqual(['The trailer']);
  });

  it('puts trailers before teasers, and official videos first within each', () => {
    const titles = toVideos([
      video({ id: '1', name: 'Fan teaser', type: 'Teaser', official: false }),
      video({ id: '2', name: 'Official teaser', type: 'Teaser' }),
      video({ id: '3', name: 'Fan trailer', official: false }),
      video({ id: '4', name: 'Official trailer' }),
    ]).map((item) => item.title);

    expect(titles).toEqual(['Official trailer', 'Fan trailer', 'Official teaser', 'Fan teaser']);
  });

  it('shows at most 6', () => {
    const many = Array.from({ length: 8 }, (_, index) => video({ id: `video-${index}` }));

    expect(toVideos(many)).toHaveLength(6);
  });

  it('names a video with no name by its type', () => {
    expect(toVideos([video({ name: ' ', type: 'Teaser' })])[0]?.title).toBe('Teaser');
  });
});

describe('toMediaData: images', () => {
  function toImages(paths: string[]) {
    return toMediaData({
      title: 'Dune',
      images: { backdrops: paths.map(backdrop), posters: [], logos: [] },
    }).images;
  }

  it('shows a backdrop at w780, links to the original and names the title and number', () => {
    expect(toImages(['/one.jpg', '/two.jpg'])[1]).toEqual({
      id: '/two.jpg',
      thumbnailUrl: 'https://image.tmdb.org/t/p/w780/two.jpg',
      url: 'https://image.tmdb.org/t/p/original/two.jpg',
      alt: 'Dune, image 2',
    });
  });

  it('takes the first 12', () => {
    const paths = Array.from({ length: 14 }, (_, index) => `/image-${index}.jpg`);
    const images = toImages(paths);

    expect(images).toHaveLength(12);
    expect(images[11]?.id).toBe('/image-11.jpg');
  });
});

describe('toMediaData: missing data', () => {
  it('degrades to empty lists when TMDB leaves the blocks out', () => {
    expect(toMediaData({ title: 'Dune' })).toEqual({ videos: [], images: [] });
  });
});
