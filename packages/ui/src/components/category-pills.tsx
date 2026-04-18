'use client';

import { useState } from 'react';
import { cn } from '../lib/utils';

interface CategoryPillsProps {
  categories: string[];
  defaultCategory?: string;
  onChange?: (category: string) => void;
  className?: string;
}

export function CategoryPills({
  categories,
  defaultCategory,
  onChange,
  className,
}: CategoryPillsProps) {
  const [selected, setSelected] = useState(defaultCategory || categories[0]);

  const handleSelect = (category: string) => {
    setSelected(category);
    onChange?.(category);
  };

  return (
    <div className={cn('flex gap-2 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-2', className)}>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => handleSelect(category)}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200',
            selected === category
              ? 'bg-foreground text-background'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
