import { Info } from 'lucide-react';
import { useId } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ImagePlaceholder } from './image-placeholder';
import { buttonVariants } from './ui/button';

/** What the `Hero` renders; build it with `toHeroData`. */
export type HeroData = {
  id: number;
  title: string;
  description: string | null;
  /** Backdrop; `null` → placeholder. */
  imageUrl: string | null;
  /** Smaller and larger backdrops for `srcSet`; `null` when there is no backdrop. */
  imageSrcSet: string | null;
  year: string | null;
  /** Formatted rating; `null` hides the badge (`'0.0'` is shown). */
  rating: string | null;
  /** Details page. */
  href: string;
};

export type HeroProps = {
  movie: HeroData;
  className?: string;
};

export function Hero({ movie, className }: HeroProps) {
  const { title, description, imageUrl, imageSrcSet, year, rating, href } = movie;
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'relative flex min-h-[70svh] items-end sm:min-h-[80svh] lg:min-h-[85svh]',
        className
      )}
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        {imageUrl ? (
          // The hero is the largest above-the-fold image: fetch it first, at the size the
          // screen needs.
          <img
            src={imageUrl}
            srcSet={imageSrcSet ?? undefined}
            sizes="100vw"
            alt=""
            fetchPriority="high"
            decoding="async"
            className="size-full object-cover"
          />
        ) : (
          <ImagePlaceholder />
        )}
        {/* Gradient Overlays */}
        <div className="from-background via-background/60 absolute inset-0 bg-linear-to-t to-transparent" />
        <div className="from-background/80 via-background/40 absolute inset-0 bg-linear-to-r to-transparent" />
      </div>

      {/* Content */}
      <div className="max-w-page relative z-10 mx-auto w-full px-4 pt-24 pb-12 sm:px-6 sm:pt-32 sm:pb-16 md:px-8 md:pb-24">
        <div className="max-w-2xl">
          {/* Metadata */}
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs sm:mb-4 sm:gap-3 sm:text-sm">
            {rating !== null && (
              <span className="bg-foreground text-background rounded px-2 py-1 font-medium">
                {rating}
              </span>
            )}
            {year !== null && <span className="text-muted-foreground">{year}</span>}
          </div>

          {/* Title */}
          <h2
            id={titleId}
            className="mb-3 text-3xl font-bold tracking-tight text-balance sm:mb-4 sm:text-4xl md:text-6xl lg:text-7xl"
          >
            {title}
          </h2>

          {/* Description */}
          {description !== null && (
            <p className="text-muted-foreground mb-6 max-w-lg text-sm leading-relaxed sm:mb-8 sm:text-base md:text-lg">
              {description}
            </p>
          )}

          {/* "My List" comes back with a watchlist, as on `MovieCard`. */}
          <Link
            to={href}
            className={cn(
              buttonVariants({ size: 'lg' }),
              'h-10 gap-2 rounded-lg px-5 text-sm font-medium sm:h-12 sm:px-8 sm:text-base'
            )}
          >
            <Info aria-hidden="true" />
            More Info
            <span className="sr-only"> about {title}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
