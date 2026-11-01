import type { BackdropSize, ImagesResponse, MediaImage, Video, VideosResponse } from '@repo/api';
import { getImageUrl } from '@repo/api';
import type { MediaData, MediaImageData, VideoData } from '../../components/media-section';
import { toOptionalText } from '../format';

const VIDEO_LIMIT = 6;
const IMAGE_LIMIT = 12;
const IMAGE_SIZE = 'w780' satisfies BackdropSize;

/** In the order the section shows them; every other type stays out. */
const VIDEO_TYPES = ['Trailer', 'Teaser'];

type MediaFields = {
  title: string;
  videos?: Partial<VideosResponse>;
  images?: Partial<ImagesResponse>;
};

export function toMediaData({ title, videos, images }: MediaFields): MediaData {
  return {
    videos: toVideosData(videos?.results ?? []),
    images: toImagesData(images?.backdrops ?? [], title),
  };
}

function toVideosData(videos: Video[]): VideoData[] {
  return videos
    .filter((video) => video.site === 'YouTube' && VIDEO_TYPES.includes(video.type))
    .sort(compareVideos)
    .slice(0, VIDEO_LIMIT)
    .map(toVideoData);
}

function compareVideos(a: Video, b: Video): number {
  const byType = VIDEO_TYPES.indexOf(a.type) - VIDEO_TYPES.indexOf(b.type);
  return byType !== 0 ? byType : Number(b.official) - Number(a.official);
}

function toVideoData({ id, key, name, type }: Video): VideoData {
  const encodedKey = encodeURIComponent(key);

  return {
    id,
    title: toOptionalText(name) ?? type,
    url: `https://www.youtube.com/watch?v=${encodedKey}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${encodedKey}/hqdefault.jpg`,
  };
}

function toImagesData(backdrops: MediaImage[], title: string): MediaImageData[] {
  return backdrops.slice(0, IMAGE_LIMIT).flatMap(({ file_path: path }, index) => {
    const thumbnailUrl = getImageUrl(path, IMAGE_SIZE);
    const url = getImageUrl(path, 'original');
    if (thumbnailUrl === null || url === null) return [];

    return [{ id: path, thumbnailUrl, url, alt: `${title}, image ${index + 1}` }];
  });
}
