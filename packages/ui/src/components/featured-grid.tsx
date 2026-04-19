import { Play, Star } from 'lucide-react';
import { cn } from '../lib/utils';

interface FeaturedItem {
  id: string | number;
  title: string;
  imageUrl: string;
  rating: number;
  genre: string;
  year: string;
}

interface FeaturedGridProps {
  title: string;
  items: FeaturedItem[];
  className?: string;
}

export function FeaturedGrid({ title, items, className }: FeaturedGridProps) {
  return (
    <section className={cn('px-4 md:px-8', className)}>
      <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-6">{title}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              'group relative rounded-lg overflow-hidden cursor-pointer',
              index === 0 && 'sm:col-span-2 sm:row-span-2'
            )}
          >
            {/* Image */}
            <div className={cn('relative', index === 0 ? 'aspect-[16/10]' : 'aspect-video')}>
              <img
                src={item.imageUrl || '/placeholder.svg'}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 rounded-full bg-foreground/90 hover:bg-foreground flex items-center justify-center transition-all hover:scale-110">
                  <Play className="w-6 h-6 text-background fill-current ml-1" />
                </div>
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    <span className="text-foreground font-medium">{item.rating.toFixed(1)}</span>
                  </div>
                  <span>•</span>
                  <span>{item.genre}</span>
                  <span>•</span>
                  <span>{item.year}</span>
                </div>
                <h3
                  className={cn(
                    'font-semibold text-foreground',
                    index === 0 ? 'text-xl md:text-2xl' : 'text-base'
                  )}
                >
                  {item.title}
                </h3>
              </div>

              {/* Rank Badge for first item */}
              {index === 0 && (
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full glass text-xs font-medium">
                  Top Rated
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
