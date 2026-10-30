import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useId } from 'react';
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
  const { ref, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll<HTMLUListElement>();
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className={cn('relative', className)}>
      {/* "See all" comes back with a page to link to. */}
      <h2
        id={titleId}
        className="mb-4 px-4 text-xl font-semibold tracking-tight md:px-8 md:text-2xl"
      >
        {title}
      </h2>

      <div className="group/carousel relative">
        <CarouselArrow direction="left" hidden={!canScrollLeft} onScroll={scroll} />
        <CarouselArrow direction="right" hidden={!canScrollRight} onScroll={scroll} />

        <ul
          ref={ref}
          className="scrollbar-hide flex gap-3 overflow-x-auto px-4 pb-4 md:gap-4 md:px-8"
        >
          {movies.map((movie) => (
            <li key={movie.id} className="w-36 shrink-0 sm:w-40 md:w-44 lg:w-48">
              <MovieCard movie={movie} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

type CarouselArrowProps = {
  direction: ScrollDirection;
  hidden: boolean;
  onScroll: (direction: ScrollDirection) => void;
};

/** A mouse convenience: keyboard and AT users reach every card without it. */
function CarouselArrow({ direction, hidden, onScroll }: CarouselArrowProps) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;

  const handleClick = () => onScroll(direction);

  return (
    <Button
      variant="ghost"
      size="icon"
      tabIndex={-1}
      aria-hidden={true}
      onClick={handleClick}
      className={cn(
        'glass absolute top-1/2 z-20 size-10 -translate-y-1/2 rounded-full',
        'opacity-0 group-hover/carousel:opacity-100',
        'transition-opacity duration-300',
        direction === 'left' ? 'left-2' : 'right-2',
        hidden && 'hidden'
      )}
    >
      <Icon />
    </Button>
  );
}
