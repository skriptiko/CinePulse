import { getImageUrl } from '@repo/api';
import type { WatchlistItem } from '@repo/firebase';
import { buildPath } from '@repo/routes';
import { ImagePlaceholder, ToggleGroup, ToggleGroupItem } from '@repo/ui';
import { Link } from 'react-router-dom';
import { isWatchStatus, STATUS_LABELS, WATCH_STATUSES } from './use-status-filter';
import { useTitleStatus } from './use-title-status';

const POSTER_SIZE_ROW = 'w92';

export type TitleListProps = {
  uid: string;
  titles: WatchlistItem[];
};

// Rows, not `MovieCard`: its title shows only on hover or focus, an inert TV card takes no focus,
// and a watchlist item has no year or rating to fill the card.
export function TitleList({ uid, titles }: TitleListProps) {
  if (titles.length === 0) return <p className="text-muted-foreground">No titles here yet.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {titles.map((item) => (
        <TitleRow key={item.id} uid={uid} item={item} />
      ))}
    </ul>
  );
}

type TitleRowProps = {
  uid: string;
  item: WatchlistItem;
};

function TitleRow({ uid, item }: TitleRowProps) {
  const { title, imageUrl, href } = toTitleRowData(item);
  const { mutate, isPending, variables } = useTitleStatus(uid, item.id);

  const handleStatusChange = (status: string) => {
    if (isWatchStatus(status)) mutate(status);
  };

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
        {/* Over the stretched link, and only as wide as it must be: the rest opens the title. */}
        <ToggleGroup
          aria-label={`Status of ${title}`}
          value={isPending ? variables : item.status}
          onValueChange={handleStatusChange}
          className="relative z-10 mt-1 w-fit"
        >
          {WATCH_STATUSES.map((status) => (
            <ToggleGroupItem
              key={status}
              value={status}
              aria-label={STATUS_LABELS[status]}
              // The fill alone is 1.1:1 against the track.
              className="touch-target data-[state=on]:ring-foreground/60 px-3 py-1 text-sm data-[state=on]:ring-1"
            >
              {STATUS_LABELS[status]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </li>
  );
}

function toTitleRowData({ mediaType, tmdbId, title, posterPath }: WatchlistItem) {
  return {
    title,
    imageUrl: getImageUrl(posterPath, POSTER_SIZE_ROW),
    // No TV details page yet.
    href: mediaType === 'movie' ? buildPath.movie(tmdbId) : null,
  };
}
