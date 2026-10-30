import { cn } from '../../lib/utils';

export type SkeletonProps = {
  className?: string;
};

/** Decorative loading placeholder; the surrounding region announces the loading state. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton"
      className={cn('bg-muted animate-pulse rounded-md motion-reduce:animate-none', className)}
    />
  );
}
