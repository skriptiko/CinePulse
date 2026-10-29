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
      className={cn('flex h-full w-full items-center justify-center bg-muted', className)}
    >
      <Film className="h-8 w-8 text-muted-foreground" />
    </div>
  );
}
