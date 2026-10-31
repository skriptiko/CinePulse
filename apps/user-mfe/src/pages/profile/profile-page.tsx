import { useGlobalStore } from '@repo/events';
import { signOutUser } from '@repo/firebase';
import { ROUTE_PATHS } from '@repo/routes';
import {
  AsyncBoundary,
  Button,
  buttonVariants,
  cn,
  formatTimestamp,
  SectionErrorFallback,
  usePageMeta,
} from '@repo/ui';
import { useMutation } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { WatchlistStats, WatchlistStatsSkeleton } from './watchlist-stats';

export function ProfilePage() {
  usePageMeta('Profile');

  const user = useGlobalStore((state) => state.user);
  const signOut = useMutation({ mutationFn: signOutUser });
  const headingId = useId();
  const [isPhotoBroken, setIsPhotoBroken] = useState(false);

  // `RequireAuth` guards the route; this covers the one render in which sign-out lands.
  if (!user) return null;

  const { uid, displayName, email, photoUrl, createdAt } = user;
  const memberSince = formatTimestamp(createdAt);

  return (
    <div className="max-w-page mx-auto px-4 pt-20 pb-16 sm:px-6 sm:pt-24 md:px-8">
      <h1 className="mb-6 text-2xl font-bold">User Profile</h1>
      <div className="flex items-center gap-4">
        {photoUrl && !isPhotoBroken && (
          // Google rejects avatar requests that carry a referrer.
          // biome-ignore lint/a11y/noNoninteractiveElementInteractions: a failed load is no interaction.
          <img
            src={photoUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="size-16 shrink-0 rounded-lg object-cover"
            onError={() => setIsPhotoBroken(true)}
          />
        )}
        <div className="min-w-0 break-words">
          {displayName && <p className="text-lg font-medium">{displayName}</p>}
          {email && <p className="text-muted-foreground">{email}</p>}
          {memberSince && (
            <p className="text-muted-foreground text-sm">Member since {memberSince}</p>
          )}
        </div>
      </div>
      <section aria-labelledby={headingId} className="mt-8 flex flex-col items-start gap-3">
        <h2 id={headingId} className="text-lg font-semibold">
          Watchlist
        </h2>
        <AsyncBoundary fallback={<WatchlistStatsSkeleton />} errorFallback={SectionErrorFallback}>
          <WatchlistStats uid={uid} />
        </AsyncBoundary>
        <Link
          to={ROUTE_PATHS.USER_WATCHLIST}
          className={cn(buttonVariants({ variant: 'link', size: 'sm' }), 'touch-target px-0')}
        >
          Open watchlist
        </Link>
      </section>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to={ROUTE_PATHS.USER_SETTINGS}
          className={buttonVariants({ variant: 'outline', className: 'touch-target' })}
        >
          Settings
        </Link>
        <Button
          variant="outline"
          className="touch-target"
          onClick={() => signOut.mutate()}
          disabled={signOut.isPending}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
