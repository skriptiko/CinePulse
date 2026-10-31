import { getImageUrl } from '@repo/api';
import type { WatchlistItem } from '@repo/firebase';
import { buildPath } from '@repo/routes';
import { Button, ImagePlaceholder, ToggleGroup, ToggleGroupItem } from '@repo/ui';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { focusOnMount } from './focus-on-mount';
import { RemoveTitleForm } from './remove-title-form';
import { isWatchStatus, STATUS_LABELS, WATCH_STATUSES } from './use-status-filter';
import { useTitleStatus } from './use-title-status';

const POSTER_SIZE_ROW = 'w92';

export type TitleListProps = {
  uid: string;
  titles: WatchlistItem[];
  /** Runs on a press that changes a status, before the write. */
  onStatusChange: (titleId: string) => void;
};

// Rows, not `MovieCard`: its title shows only on hover or focus, an inert TV card takes no focus,
// and a watchlist item has no year or rating to fill the card.
export function TitleList({ uid, titles, onStatusChange }: TitleListProps) {
  if (titles.length === 0) return null;

  return (
    <ul className="flex flex-col gap-3">
      {titles.map((item) => (
        <TitleRow key={item.id} uid={uid} item={item} onStatusChange={onStatusChange} />
      ))}
    </ul>
  );
}

type TitleRowProps = {
  uid: string;
  item: WatchlistItem;
  onStatusChange: (titleId: string) => void;
};

function TitleRow({ uid, item, onStatusChange }: TitleRowProps) {
  const { title, imageUrl, href } = toTitleRowData(item);
  const { mutate, isPending, variables } = useTitleStatus(uid, item.id);
  const [isAsking, setIsAsking] = useState(false);
  const [isReturningFocus, setIsReturningFocus] = useState(false);

  const handleStatusChange = (status: string) => {
    if (!isWatchStatus(status)) return;
    onStatusChange(item.id);
    mutate(status);
  };

  const handleAsk = () => {
    setIsAsking(true);
    setIsReturningFocus(false);
  };

  const handleCancel = () => {
    setIsAsking(false);
    setIsReturningFocus(true);
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
        {/* The controls sit over the stretched link: the rest of the row opens the title. */}
        <div className="mt-1 flex flex-wrap items-center gap-x-2">
          <ToggleGroup
            aria-label={`Status of ${title}`}
            value={isPending ? variables : item.status}
            onValueChange={handleStatusChange}
            className="relative z-10"
          >
            {WATCH_STATUSES.map((status) => (
              <ToggleGroupItem
                key={status}
                value={status}
                aria-label={STATUS_LABELS[status]}
                className="touch-target px-3 py-1 text-sm"
              >
                {STATUS_LABELS[status]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button
            ref={isReturningFocus ? focusOnMount : undefined}
            size="sm"
            variant="ghost"
            aria-label={`Remove ${title}`}
            disabled={isAsking}
            className="touch-target relative z-10"
            onClick={handleAsk}
          >
            Remove
          </Button>
        </div>
        {/* Below the controls, not in their place: a double tap must not reach the confirming button. */}
        {isAsking && (
          <RemoveTitleForm uid={uid} titleId={item.id} title={title} onClose={handleCancel} />
        )}
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
