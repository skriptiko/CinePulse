import { Film } from 'lucide-react';
import { cn } from '../lib/utils';

export type ImagePlaceholderProps = {
  className?: string;
};

/** Neutral block shown when TMDB has no image for an item. */
export function ImagePlaceholder({ className }: ImagePlaceholderProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('bg-muted flex size-full items-center justify-center', className)}
    >
      <Film className="text-muted-foreground size-8" />
    </div>
  );
}
