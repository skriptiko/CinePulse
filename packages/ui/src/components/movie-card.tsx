import { type MouseEvent, type ReactNode, useRef } from 'react';
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
  /** Details page. */
  href: string;
};

export type MovieCardProps = {
  movie: MovieCardData;
  /** A control over the poster, outside the link. */
  action?: ReactNode;
  className?: string;
};

export function MovieCard({ movie, action, className }: MovieCardProps) {
  const { title, imageUrl, year, rating, href } = movie;
  const posterRef = useRef<HTMLDivElement>(null);

  // Names the poster for the page transition (theme.css). A click with a modifier opens another
  // tab, so the card stays and must not keep the name.
  const handleOpen = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    posterRef.current?.setAttribute('data-opened-poster', '');
  };
  // A coarse pointer has no hover, so there the text shows at rest (Figma `pointer=coarse`).
  const revealClassName = cn(
    'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100',
    'translate-y-2 group-focus-within:translate-y-0 group-hover:translate-y-0 pointer-coarse:translate-y-0',
    'transition duration-300 motion-reduce:transition-none'
  );

  return (
    <div
      className={cn(
        'group @container relative grid overflow-hidden rounded-lg transition-transform duration-300',
        // The lift and the image zoom follow a fine pointer only: a tap would leave them stuck.
        'pointer-fine:hover:z-10 pointer-fine:motion-safe:hover:scale-105',
        'has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-[3px]',
        className
      )}
    >
      {/* Rounded itself: the transition snapshot leaves out the card's clip. */}
      <div
        ref={posterRef}
        className="relative col-start-1 row-start-1 aspect-[2/3] overflow-hidden rounded-lg"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-500 pointer-fine:motion-safe:group-hover:scale-110"
          />
        ) : (
          <ImagePlaceholder />
        )}

        {/* Overlay: at rest on a coarse pointer, it keeps the muted year at >= 4.5:1 on a white
            poster down to a 161 px card (the smallest that shows the year). */}
        <div
          className={cn(
            'from-background via-background/60 absolute inset-0 bg-linear-to-t to-transparent',
            'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100',
            'transition-opacity duration-300'
          )}
        />
      </div>

      {/* Bottom Content. Not positioned or transformed, so the link's `::after` fills the card;
          `z-1` works on a grid item as it is, and lifts the text over the gradient. */}
      <div className="z-1 col-start-1 row-start-1 min-w-0 self-end p-3">
        <h3 className="text-foreground mb-1 text-sm font-medium @max-[160px]:text-xs @min-[301px]:text-base">
          <Link
            to={href}
            onClick={handleOpen}
            className="after:absolute after:inset-0 focus-visible:outline-hidden"
          >
            <span className={cn('block truncate', revealClassName)}>{title}</span>
          </Link>
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
