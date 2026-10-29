import { Info, Play, Plus } from 'lucide-react';
import { ImagePlaceholder } from './image-placeholder';
import { Button } from './ui/button';

/** What the `Hero` renders; build it with `toHeroData`. */
export type HeroData = {
  id: number;
  title: string;
  description: string | null;
  /** Backdrop; `null` → placeholder. */
  imageUrl: string | null;
  year: string | null;
  /** Formatted rating; `null` hides the badge (`'0.0'` is shown). */
  rating: string | null;
};

export type HeroProps = {
  movie: HeroData;
};

export function Hero({ movie }: HeroProps) {
  const { title, description, imageUrl, year, rating } = movie;

  return (
    <section className="relative min-h-[70vh] sm:min-h-[80vh] lg:min-h-[85vh] flex items-end">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <ImagePlaceholder />
        )}
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 pb-12 sm:pb-16 md:pb-24 pt-24 sm:pt-32 w-full">
        <div className="max-w-2xl">
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4 text-xs sm:text-sm">
            {rating !== null && (
              <span className="px-2 py-1 rounded bg-foreground text-background font-medium">
                {rating}
              </span>
            )}
            {year !== null && <span className="text-muted-foreground">{year}</span>}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-3 sm:mb-4 text-balance">
            {title}
          </h1>

          {/* Description */}
          {description !== null && (
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed mb-6 sm:mb-8 max-w-lg">
              {description}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              size="lg"
              className="rounded-lg gap-2 px-5 sm:px-8 h-10 sm:h-12 text-sm sm:text-base font-medium"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              Play
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="rounded-lg gap-2 px-4 sm:px-6 h-10 sm:h-12 text-sm sm:text-base font-medium glass"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              My List
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg w-10 h-10 sm:w-12 sm:h-12 glass"
            >
              <Info className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="sr-only">More Info</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
