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

const tileVariants = cva('group relative overflow-hidden rounded-lg', {
  variants: { featured: { true: 'sm:col-span-2 sm:row-span-2', false: '' } },
});

const tileImageVariants = cva('relative', {
  variants: { featured: { true: 'aspect-[16/10]', false: 'aspect-video' } },
});

const tileTitleVariants = cva('text-foreground font-semibold', {
  variants: { featured: { true: 'text-xl md:text-2xl', false: 'text-base' } },
});

export function FeaturedGrid({ title, items, className }: FeaturedGridProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className={cn('px-4 md:px-8', className)}>
      <h2 id={titleId} className="mb-6 text-xl font-semibold tracking-tight md:text-2xl">
        {title}
      </h2>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
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

        <div className="from-background via-background/40 absolute inset-0 bg-linear-to-t to-transparent opacity-80 transition-opacity group-hover:opacity-90" />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="bg-foreground/90 hover:bg-foreground flex size-14 items-center justify-center rounded-full transition-[transform,background-color] motion-safe:hover:scale-110">
            <Play aria-hidden="true" className="text-background ml-1 size-6 fill-current" />
          </div>
        </div>

        <div className="absolute right-0 bottom-0 left-0 p-4">
          <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
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
          <div className="glass absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-medium">
            Top Rated
          </div>
        )}
      </div>
    </li>
  );
}
