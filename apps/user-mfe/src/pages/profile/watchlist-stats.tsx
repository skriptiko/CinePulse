import { type WatchStatus, watchlistQueries } from '@repo/firebase';
import { ROUTE_PATHS } from '@repo/routes';
import { buttonVariants, cn, Skeleton, SkeletonFrame } from '@repo/ui';
import { useSuspenseQueries } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

const STATS_GRID_CLASS = 'grid w-full max-w-lg grid-cols-2 gap-4 sm:grid-cols-4';

type WatchlistStatsProps = {
  uid: string;
};

/** Shares its queries with the watchlist page, so visiting both reads every title once. */
export function WatchlistStats({ uid }: WatchlistStatsProps) {
  const [{ data: folders }, { data: items }] = useSuspenseQueries({
    queries: [watchlistQueries.folders(uid), watchlistQueries.items(uid)],
  });

  if (items.length === 0) {
    return (
      <div className="flex flex-wrap items-center gap-x-3">
        <p className="text-muted-foreground">No titles yet.</p>
        <Link
          to={ROUTE_PATHS.MOVIES}
          className={cn(buttonVariants({ variant: 'link', size: 'sm' }), 'touch-target px-0')}
        >
          Browse movies
        </Link>
      </div>
    );
  }

  const countOf = (status: WatchStatus) => items.filter((item) => item.status === status).length;
  const stats = [
    { label: 'Titles', value: items.length },
    { label: 'Planned', value: countOf('planned') },
    { label: 'Watched', value: countOf('watched') },
    { label: 'Folders', value: folders.length },
  ];

  return (
    <dl className={STATS_GRID_CLASS}>
      {stats.map(({ label, value }) => (
        <div key={label}>
          <dt className="text-muted-foreground text-sm">{label}</dt>
          <dd className="text-2xl font-bold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function WatchlistStatsSkeleton() {
  return (
    <SkeletonFrame className={STATS_GRID_CLASS}>
      <Skeleton className="h-13" />
      <Skeleton className="h-13" />
      <Skeleton className="h-13" />
      <Skeleton className="h-13" />
    </SkeletonFrame>
  );
}
