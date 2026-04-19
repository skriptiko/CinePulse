import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';
import { cn } from '../lib/utils';
import { Button } from './button';
import { MovieCard } from './movie-card';

interface Movie {
  id: string | number;
  title: string;
  imageUrl: string;
  year?: string;
  rating?: string;
  duration?: string;
}

interface ContentRowProps {
  title: string;
  movies: Movie[];
  className?: string;
}

export function ContentRow({ title, movies, className }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <section className={cn('relative', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 md:px-8">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h2>
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          See all
        </button>
      </div>

      {/* Carousel Container */}
      <div className="relative group/carousel">
        {/* Left Arrow */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full glass',
            'opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300',
            !canScrollLeft && 'hidden'
          )}
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="sr-only">Scroll left</span>
        </Button>

        {/* Right Arrow */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full glass',
            'opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300',
            !canScrollRight && 'hidden'
          )}
          onClick={() => scroll('right')}
        >
          <ChevronRight className="w-5 h-5" />
          <span className="sr-only">Scroll right</span>
        </Button>

        {/* Scrollable Content */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-4"
        >
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              title={movie.title}
              imageUrl={movie.imageUrl}
              year={movie.year}
              rating={movie.rating}
              duration={movie.duration}
              className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
