'use client';

import { ComponentProps } from 'react';
import { Star } from 'lucide-react';

interface RatingProps extends Omit<ComponentProps<'div'>, 'value'> {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function Rating({ value, max = 5, size = 'md', className, ...props }: RatingProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className={`flex gap-0.5 ${className}`} {...props}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={`${sizeClasses[size || 'md']} ${
            i < value ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
          } transition-all duration-200`}
        />
      ))}
    </div>
  );
}
