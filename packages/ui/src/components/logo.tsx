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
    <Link to="/" className={cn('flex items-center gap-2', className)}>
      <div className="size-8 rounded-lg bg-foreground flex items-center justify-center">
        <span className="text-background font-bold text-sm">CP</span>
      </div>
      <span className={cn('font-semibold tracking-tight', labelClassName)}>CinePulse</span>
    </Link>
  );
}
