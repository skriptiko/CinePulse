import type { ReactNode } from 'react';
import { useDelayedFlag } from '../hooks/use-delayed-flag';
import { cn } from '../lib/utils';
import { Skeleton } from './ui/skeleton';

/** Fast loads finish before this and never flash a skeleton. */
export const SKELETON_DELAY_MS = 300;

// Static placeholders never reorder, so fixed string keys are enough.
const ROW_CARD_KEYS = createKeys('row-card', 6);
const GRID_CARD_KEYS = createKeys('grid-card', 12);
const FEATURED_TILE_KEYS = createKeys('featured-tile', 4);

export function PageSkeleton() {
  return (
    <SkeletonFrame className="px-4 pt-24 sm:px-6 lg:px-12">
      <Skeleton className="mb-4 h-10 w-64" />
      <Skeleton className="mb-2 h-4 w-full max-w-xl" />
      <Skeleton className="h-4 w-full max-w-md" />
    </SkeletonFrame>
  );
}

export function HeroSkeleton() {
  return (
    <SkeletonFrame>
      <Skeleton className="min-h-[70svh] w-full rounded-none sm:min-h-[80svh] lg:min-h-[85svh]" />
    </SkeletonFrame>
  );
}

export function ContentRowSkeleton() {
  return (
    <SkeletonFrame className="px-4 sm:px-6 lg:px-12">
      <CardRowSkeleton />
    </SkeletonFrame>
  );
}

export function FeaturedGridSkeleton() {
  return (
    <SkeletonFrame className="px-4 md:px-8">
      <Skeleton className="mb-6 h-6 w-40" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Skeleton className="col-span-2 row-span-2 aspect-video rounded-lg md:aspect-auto" />
        {FEATURED_TILE_KEYS.map((key) => (
          <Skeleton key={key} className="aspect-video rounded-lg" />
        ))}
      </div>
    </SkeletonFrame>
  );
}

export function MovieGridSkeleton() {
  return (
    <SkeletonFrame className="px-4 pt-28 sm:px-6 sm:pt-36 lg:px-12">
      <Skeleton className="mb-2 h-12 w-48" />
      <Skeleton className="mb-8 h-4 w-64" />
      <Skeleton className="mb-8 h-10 w-full max-w-md" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 lg:gap-6 xl:grid-cols-6">
        {GRID_CARD_KEYS.map((key) => (
          <Skeleton key={key} className="aspect-[2/3] w-full rounded-lg" />
        ))}
      </div>
    </SkeletonFrame>
  );
}

function CardRowSkeleton() {
  return (
    <div>
      <Skeleton className="mb-4 h-6 w-40" />
      <div className="flex gap-3 overflow-hidden sm:gap-4">
        {ROW_CARD_KEYS.map((key) => (
          <Skeleton
            key={key}
            className="aspect-[2/3] w-36 shrink-0 rounded-lg sm:w-40 md:w-44 lg:w-48"
          />
        ))}
      </div>
    </div>
  );
}

type SkeletonFrameProps = {
  children: ReactNode;
  className?: string;
};

/** Reserves the page layout at once, but shows it (and announces loading) only after a delay. */
function SkeletonFrame({ children, className }: SkeletonFrameProps) {
  const isVisible = useDelayedFlag(SKELETON_DELAY_MS);

  return (
    <output
      aria-busy="true"
      data-testid="page-skeleton"
      className={cn('block', !isVisible && 'invisible', className)}
    >
      <span className="sr-only">Loading…</span>
      {children}
    </output>
  );
}

function createKeys(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${prefix}-${index}`);
}
