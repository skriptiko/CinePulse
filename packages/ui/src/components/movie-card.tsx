'use client';

import { Check, Play, Plus } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

interface MovieCardProps {
  title: string;
  imageUrl: string;
  year?: string;
  rating?: string;
  duration?: string;
  isInList?: boolean;
  className?: string;
}

export function MovieCard({
  title,
  imageUrl,
  year,
  rating,
  duration,
  isInList = false,
  className,
}: MovieCardProps) {
  const [inList, setInList] = useState(isInList);

  return (
    <div
      className={cn(
        'group relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300',
        'hover:scale-105 hover:z-10',
        className
      )}
      onMouseEnter={() => {}}
      onMouseLeave={() => {}}
    >
      {/* Poster Image */}
      <div className="aspect-[2/3] relative">
        <img
          src={imageUrl || '/placeholder.svg'}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Hover Overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-300'
          )}
        />

        {/* Play Button - Center */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-all duration-300'
          )}
        >
          <button
            type="button"
            className="w-14 h-14 rounded-full bg-foreground/90 hover:bg-foreground flex items-center justify-center transition-all hover:scale-110"
          >
            <Play className="w-6 h-6 text-background fill-current ml-1" />
          </button>
        </div>

        {/* Bottom Content */}
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 p-3',
            'translate-y-full group-hover:translate-y-0 transition-transform duration-300'
          )}
        >
          <h3 className="text-sm font-medium text-foreground truncate mb-1">{title}</h3>
          {(year || rating || duration) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {rating && (
                <span className="px-1.5 py-0.5 rounded bg-foreground/10 text-foreground text-[10px] font-medium">
                  {rating}
                </span>
              )}
              {year && <span>{year}</span>}
              {duration && (
                <>
                  <span>•</span>
                  <span>{duration}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Add to List Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setInList(!inList);
          }}
          className={cn(
            'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-all duration-300',
            inList
              ? 'bg-accent text-accent-foreground'
              : 'bg-background/60 text-foreground hover:bg-background/80'
          )}
        >
          {inList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
