import { ROUTE_PATHS } from '@repo/routes';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export type LogoProps = {
  className?: string;
  /** Classes for the "CinePulse" wordmark next to the badge. */
  labelClassName?: string;
};

/** "CP" badge plus wordmark, linking home. */
export function Logo({ className, labelClassName }: LogoProps) {
  return (
    <Link to={ROUTE_PATHS.HOME} className={cn('flex items-center gap-2', className)}>
      <div className="bg-foreground flex size-8 items-center justify-center rounded-lg">
        <span className="text-background text-sm font-bold">CP</span>
      </div>
      <span className={cn('font-semibold tracking-tight', labelClassName)}>CinePulse</span>
    </Link>
  );
}
