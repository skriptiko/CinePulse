import { cva } from 'class-variance-authority';
import { Play, Star } from 'lucide-react';
import { Fragment, useId } from 'react';
import { cn } from '../lib/utils';
import { ImagePlaceholder } from './image-placeholder';

/** One tile of a `FeaturedGrid`; build it with `toFeaturedItemData`. */
export type FeaturedItemData = {
  id: number;
  title: string;
  /** Backdrop; `null` → placeholder. */
  imageUrl: string | null;
  year: string | null;
  /** Formatted rating; `null` hides it (`'0.0'` is shown). */
  rating: string | null;
  genre: string | null;
};

export type FeaturedGridProps = {
  title: string;
  items: FeaturedItemData[];
  className?: string;
};

const tileVariants = cva('group relative rounded-lg overflow-hidden', {
  variants: { featured: { true: 'sm:col-span-2 sm:row-span-2', false: '' } },
});

const tileImageVariants = cva('relative', {
  variants: { featured: { true: 'aspect-[16/10]', false: 'aspect-video' } },
});

const tileTitleVariants = cva('font-semibold text-foreground', {
  variants: { featured: { true: 'text-xl md:text-2xl', false: 'text-base' } },
});

export function FeaturedGrid({ title, items, className }: FeaturedGridProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className={cn('px-4 md:px-8', className)}>
      <h2 id={titleId} className="text-xl md:text-2xl font-semibold tracking-tight mb-6">
        {title}
      </h2>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {items.map((item, index) => (
          <FeaturedTile key={item.id} item={item} featured={index === 0} />
        ))}
      </ul>
    </section>
  );
}

type FeaturedTileProps = {
  item: FeaturedItemData;
  /** The first, double-size tile with the "Top Rated" badge. */
  featured: boolean;
};

function FeaturedTile({ item, featured }: FeaturedTileProps) {
  const { title, imageUrl, rating, genre, year } = item;
  const details = [genre, year].filter((detail) => detail !== null);

  return (
    <li className={tileVariants({ featured })}>
      <div className={tileImageVariants({ featured })}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
          />
        ) : (
          <ImagePlaceholder />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="size-14 rounded-full bg-foreground/90 hover:bg-foreground flex items-center justify-center transition-[transform,background-color] motion-safe:hover:scale-110">
            <Play aria-hidden="true" className="size-6 text-background fill-current ml-1" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
            {rating !== null && (
              <div className="flex items-center gap-1">
                <Star aria-hidden="true" className="size-3 fill-yellow-500 text-yellow-500" />
                <span className="text-foreground font-medium">{rating}</span>
              </div>
            )}
            {details.map((detail, detailIndex) => (
              <Fragment key={detail}>
                {(rating !== null || detailIndex > 0) && <span aria-hidden="true">•</span>}
                <span>{detail}</span>
              </Fragment>
            ))}
          </div>
          <h3 className={tileTitleVariants({ featured })}>{title}</h3>
        </div>

        {featured && (
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full glass text-xs font-medium">
            Top Rated
          </div>
        )}
      </div>
    </li>
  );
}
