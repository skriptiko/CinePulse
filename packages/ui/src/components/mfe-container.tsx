import type { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { Skeleton } from './skeleton';

interface MfeContainerProps {
  children: ReactNode;
  id: string;
  minHeight?: string;
  className?: string;
  isLoading?: boolean;
}

function MfeContainer({
  children,
  id,
  minHeight = '200px',
  className,
  isLoading = false,
}: MfeContainerProps) {
  return (
    <div id={id} className={cn('relative', className)} style={{ minHeight }}>
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="space-y-4 w-full p-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export { MfeContainer };
export type { MfeContainerProps };
