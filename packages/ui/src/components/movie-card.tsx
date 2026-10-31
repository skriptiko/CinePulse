import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ImagePlaceholder } from './image-placeholder';

/** What a `MovieCard` renders; build it with `toMovieCardData` / `toTvCardData`. */
export type MovieCardData = {
  id: number;
  title: string;
  mediaType: 'movie' | 'tv';
  /** The TMDB path behind `imageUrl`, for whoever stores the title. */
  posterPath: string | null;
  /** `null` → placeholder. */
  imageUrl: string | null;
  year: string | null;
  /** Formatted rating; `null` hides the badge (`'0.0'` is shown). */
  rating: string | null;
  /** Details page; `null` while the media type has none, which leaves the card inert. */
  href: string | null;
};

export type MovieCardProps = {
  movie: MovieCardData;
  /** A control over the poster, outside the link. */
  action?: ReactNode;
  className?: string;
};

export function MovieCard({ movie, action, className }: MovieCardProps) {
  const { title, imageUrl, year, rating, href } = movie;
  const revealClassName = cn(
    'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100',
    'translate-y-2 group-focus-within:translate-y-0 group-hover:translate-y-0',
    'transition duration-300 motion-reduce:transition-none'
  );
  const titleText = <span className={cn('block truncate', revealClassName)}>{title}</span>;

  return (
    <div
      className={cn(
        'group @container relative grid overflow-hidden rounded-lg transition-transform duration-300',
        'hover:z-10 motion-safe:hover:scale-105',
        'has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-[3px]',
        className
      )}
    >
      <div className="relative col-start-1 row-start-1 aspect-[2/3]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-110"
          />
        ) : (
          <ImagePlaceholder />
        )}

        {/* Hover Overlay */}
        <div
          className={cn(
            'from-background via-background/60 absolute inset-0 bg-linear-to-t to-transparent',
            'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100',
            'transition-opacity duration-300'
          )}
        />
      </div>

      {/* Bottom Content. Not positioned or transformed, so the link's `::after` fills the card;
          `z-1` works on a grid item as it is, and lifts the text over the gradient. */}
      <div className="z-1 col-start-1 row-start-1 min-w-0 self-end p-3">
        <h3 className="text-foreground mb-1 text-sm font-medium @max-[160px]:text-xs @min-[301px]:text-base">
          {href === null ? (
            titleText
          ) : (
            <Link to={href} className="outline-hidden after:absolute after:inset-0">
              {titleText}
            </Link>
          )}
        </h3>
        {(year !== null || rating !== null) && (
          <div
            className={cn(
              // `pointer-events-none`: `revealClassName` lifts this over the link's `::after`.
              'text-muted-foreground pointer-events-none flex items-center gap-2 text-xs @max-[160px]:hidden',
              revealClassName
            )}
          >
            {rating !== null && (
              <span className="bg-foreground/10 text-foreground rounded px-1.5 py-0.5 text-xs font-medium">
                {rating}
              </span>
            )}
            {year !== null && <span>{year}</span>}
          </div>
        )}
      </div>

      {action !== undefined && <div className="absolute top-2 right-2 z-10">{action}</div>}
    </div>
  );
}
