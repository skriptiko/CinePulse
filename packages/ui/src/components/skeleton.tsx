import { cn } from '../lib/utils';

export type SkeletonProps = {
  className?: string;
};

/** Decorative loading placeholder; the surrounding region announces the loading state. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton"
      className={cn('animate-pulse motion-reduce:animate-none rounded-md bg-muted', className)}
    />
  );
}
