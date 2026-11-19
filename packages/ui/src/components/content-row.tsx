import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type ReactNode, useId } from 'react';
import { type ScrollDirection, useHorizontalScroll } from '../hooks/use-horizontal-scroll';
import { cn } from '../lib/utils';
import { MovieCard, type MovieCardData } from './movie-card';
import { Button } from './ui/button';

/**
 * The page gutter, and from `2xl` the capped left edge of `max-w-page`: the heading and the first
 * card start where the Header does, and the cards run on to the right edge of the screen.
 * `max()` keeps the gutter at 48 while the screen is still narrower than the cap.
 */
const ROW_GUTTER =
  'px-4 sm:px-6 lg:px-12 2xl:pl-[max(3rem,calc((100%-var(--container-page))/2+3rem))]';

export type ContentRowProps = {
  title: string;
  movies: MovieCardData[];
  /** Builds each card's `action`. */
  renderCardAction?: (movie: MovieCardData) => ReactNode;
  /** Side padding of the heading and the cards, so the row lines up with the page it sits on. */
  gutterClassName?: string;
  className?: string;
};

export function ContentRow({
  title,
  movies,
  renderCardAction,
  gutterClassName = ROW_GUTTER,
  className,
}: ContentRowProps) {
  const { ref, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll<HTMLUListElement>();
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className={cn('relative', className)}>
      {/* "See all" comes back with a page to link to. */}
      <h2 id={titleId} className={cn('heading-section mb-4', gutterClassName)}>
        {title}
      </h2>

      <div className="group/carousel relative">
        <CarouselArrow direction="left" hidden={!canScrollLeft} onScroll={scroll} />
        <CarouselArrow direction="right" hidden={!canScrollRight} onScroll={scroll} />

        {/* `scroll-px-*` matches a card, so focus never stops on a card cut off at the edge.
            `-mt-1 pt-1` leaves room for the ring of a card, which the scroller would clip. */}
        <ul
          ref={ref}
          className={cn(
            'scrollbar-hide -mt-1 flex scroll-px-36 gap-3 overflow-x-auto pt-1 pb-4 sm:scroll-px-40 md:scroll-px-44 md:gap-4 lg:scroll-px-48',
            gutterClassName
          )}
        >
          {movies.map((movie) => (
            // A movie and a show can share an id.
            <li
              key={`${movie.mediaType}-${movie.id}`}
              className="w-36 shrink-0 sm:w-40 md:w-44 lg:w-48"
            >
              <MovieCard movie={movie} action={renderCardAction?.(movie)} />
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
