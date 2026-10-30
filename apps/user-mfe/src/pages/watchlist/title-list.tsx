import { getImageUrl } from '@repo/api';
import type { WatchlistItem, WatchStatus } from '@repo/firebase';
import { buildPath } from '@repo/routes';
import { ImagePlaceholder } from '@repo/ui';
import { Link } from 'react-router-dom';

const POSTER_SIZE_ROW = 'w92';

const STATUS_LABELS: Record<WatchStatus, string> = {
  planned: 'Planned',
  watched: 'Watched',
};

export type TitleListProps = {
  titles: WatchlistItem[];
};

// Rows, not `MovieCard`: its title shows only on hover or focus, an inert TV card takes no focus,
// and a watchlist item has no year or rating to fill the card.
export function TitleList({ titles }: TitleListProps) {
  if (titles.length === 0) return <p className="text-muted-foreground">No titles here yet.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {titles.map((item) => (
        <TitleRow key={item.id} item={item} />
      ))}
    </ul>
  );
}

type TitleRowProps = {
  item: WatchlistItem;
};

function TitleRow({ item }: TitleRowProps) {
  const { title, imageUrl, href, statusLabel } = toTitleRowData(item);

  return (
    <li className="relative flex items-center gap-3">
      <div className="aspect-[2/3] w-12 shrink-0 overflow-hidden rounded">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        ) : (
          <ImagePlaceholder />
        )}
      </div>
      <div className="min-w-0">
        {href ? (
          <Link
            to={href}
            className="block truncate font-medium after:absolute after:inset-0 hover:underline"
          >
            {title}
          </Link>
        ) : (
          <p className="truncate font-medium">{title}</p>
        )}
        <p className="text-muted-foreground text-sm">{statusLabel}</p>
      </div>
    </li>
  );
}

function toTitleRowData({ mediaType, tmdbId, title, posterPath, status }: WatchlistItem) {
  return {
    title,
    imageUrl: getImageUrl(posterPath, POSTER_SIZE_ROW),
    // No TV details page yet.
    href: mediaType === 'movie' ? buildPath.movie(tmdbId) : null,
    statusLabel: STATUS_LABELS[status],
  };
}
