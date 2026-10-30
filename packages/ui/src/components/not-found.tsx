import { ROUTE_PATHS } from '@repo/routes';
import { useId } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/use-page-meta';
import { cn } from '../lib/utils';
import { buttonVariants } from './ui/button';

export function NotFound() {
  usePageMeta('Page not found');
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 pt-24 text-center"
    >
      <p className="text-muted-foreground text-6xl font-bold">404</p>
      <h1 id={titleId} className="text-2xl font-semibold sm:text-3xl">
        Page not found
      </h1>
      <p className="text-muted-foreground max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to={ROUTE_PATHS.HOME} className={cn(buttonVariants(), 'mt-2')}>
        Go home
      </Link>
    </section>
  );
}
