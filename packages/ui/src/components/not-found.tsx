import { ROUTE_PATHS } from '@repo/routes';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/use-page-meta';
import { cn } from '../lib/utils';
import { buttonVariants } from './ui/button';

export function NotFound() {
  usePageMeta('Page not found');

  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 pt-24 text-center">
      <p className="text-6xl font-bold text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold sm:text-3xl">Page not found</h1>
      <p className="max-w-md text-muted-foreground">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to={ROUTE_PATHS.HOME} className={cn(buttonVariants(), 'mt-2')}>
        Go home
      </Link>
    </section>
  );
}
