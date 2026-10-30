import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ImagePlaceholder } from './image-placeholder';

/** What a `MovieCard` renders; build it with `toMovieCardData` / `toTvCardData`. */
export type MovieCardData = {
  id: number;
  title: string;
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
  className?: string;
};

// The "add to list" toggle is hidden until a watchlist exists: a local-only toggle
// would pretend to save something.
export function MovieCard({ movie, className }: MovieCardProps) {
  const { title, imageUrl, year, rating, href } = movie;
  const cardClassName = cn(
    'group relative block overflow-hidden rounded-lg transition-transform duration-300',
    'hover:z-10 motion-safe:hover:scale-105',
    'focus-visible:ring-ring outline-hidden focus-visible:ring-[3px]',
    className
  );

  const content = (
    <div className="relative aspect-[2/3]">
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

      {/* Bottom Content */}
      <div
        className={cn(
          'absolute right-0 bottom-0 left-0 p-3',
          'translate-y-full group-focus-within:translate-y-0 group-hover:translate-y-0',
          'transition-transform duration-300 motion-reduce:transition-none'
        )}
      >
        <h3 className="text-foreground mb-1 truncate text-sm font-medium">{title}</h3>
        {(year !== null || rating !== null) && (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            {rating !== null && (
              <span className="bg-foreground/10 text-foreground rounded px-1.5 py-0.5 text-xs font-medium">
                {rating}
              </span>
            )}
            {year !== null && <span>{year}</span>}
          </div>
        )}
      </div>
    </div>
  );

  if (href === null) return <div className={cardClassName}>{content}</div>;
  return (
    <Link to={href} className={cardClassName}>
      {content}
    </Link>
  );
}
