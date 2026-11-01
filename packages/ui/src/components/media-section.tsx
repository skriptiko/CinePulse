import { Play } from 'lucide-react';
import { DetailSection, DetailSectionEmpty } from './detail-section';
import { ExternalLink } from './external-link';

export type VideoData = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
};

export type MediaImageData = {
  id: string;
  thumbnailUrl: string;
  /** The original file. */
  url: string;
  alt: string;
};

/** What `MediaSection` renders; build it with `toMediaData`. */
export type MediaData = {
  videos: VideoData[];
  images: MediaImageData[];
};

export type MediaSectionProps = {
  media: MediaData;
};

/** Videos are links, not embeds: see ADR-0017. */
export function MediaSection({ media }: MediaSectionProps) {
  const { videos, images } = media;

  return (
    <DetailSection title="Videos and images">
      {videos.length === 0 && images.length === 0 && (
        <DetailSectionEmpty>No videos or images yet.</DetailSectionEmpty>
      )}

      {videos.length > 0 && (
        <ul
          aria-label="Videos"
          className="mb-6 grid gap-3 last:mb-0 sm:grid-cols-2 md:gap-4 lg:grid-cols-3"
        >
          {videos.map((video) => (
            <li key={video.id}>
              <VideoCard video={video} />
            </li>
          ))}
        </ul>
      )}

      {images.length > 0 && (
        <ul
          aria-label="Images"
          className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4"
        >
          {images.map(({ id, thumbnailUrl, url, alt }) => (
            <li key={id}>
              <ExternalLink href={url} className="bg-muted block overflow-hidden rounded-lg">
                <img
                  src={thumbnailUrl}
                  alt={alt}
                  loading="lazy"
                  decoding="async"
                  className="aspect-video w-full object-cover"
                />
              </ExternalLink>
            </li>
          ))}
        </ul>
      )}
    </DetailSection>
  );
}

function VideoCard({ video }: { video: VideoData }) {
  const { title, url, thumbnailUrl } = video;

  return (
    <ExternalLink href={url} className="group block">
      <div className="bg-muted relative mb-2 aspect-video overflow-hidden rounded-lg">
        <img
          src={thumbnailUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="glass rounded-full p-3">
            <Play aria-hidden="true" className="size-5" />
          </span>
        </div>
      </div>
      <span className="block text-sm font-medium wrap-anywhere group-hover:underline">{title}</span>
    </ExternalLink>
  );
}
