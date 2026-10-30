import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type ScrollDirection, useHorizontalScroll } from '../hooks/use-horizontal-scroll';
import { cn } from '../lib/utils';
import { MovieCard, type MovieCardData } from './movie-card';
import { Button } from './ui/button';

export type ContentRowProps = {
  title: string;
  movies: MovieCardData[];
  className?: string;
};

export function ContentRow({ title, movies, className }: ContentRowProps) {
  const { ref, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll<HTMLDivElement>();

  return (
    <section className={cn('relative', className)}>
      <div className="flex items-center justify-between mb-4 px-4 md:px-8">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h2>
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          See all
        </button>
      </div>

      <div className="relative group/carousel">
        <CarouselArrow direction="left" hidden={!canScrollLeft} onScroll={scroll} />
        <CarouselArrow direction="right" hidden={!canScrollRight} onScroll={scroll} />

        <div
          ref={ref}
          className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-4"
        >
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              className="shrink-0 w-36 sm:w-40 md:w-44 lg:w-48"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

type CarouselArrowProps = {
  direction: ScrollDirection;
  hidden: boolean;
  onScroll: (direction: ScrollDirection) => void;
};

function CarouselArrow({ direction, hidden, onScroll }: CarouselArrowProps) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;

  const handleClick = () => onScroll(direction);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 z-20 size-10 rounded-full glass',
        'opacity-0 group-hover/carousel:opacity-100 focus-visible:opacity-100',
        'transition-opacity duration-300',
        direction === 'left' ? 'left-2' : 'right-2',
        hidden && 'hidden'
      )}
    >
      <Icon />
      <span className="sr-only">{direction === 'left' ? 'Scroll left' : 'Scroll right'}</span>
    </Button>
  );
}
