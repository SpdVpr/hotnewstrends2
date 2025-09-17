import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'trending' | 'success' | 'warning' | 'danger' | 'category';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center font-semibold rounded-full';
    
    const variants = {
      primary: 'bg-primary text-white',
      secondary: 'bg-surface text-text-secondary',
      trending: 'bg-orange text-white',
      success: 'bg-green text-white',
      warning: 'bg-yellow text-text',
      danger: 'bg-red text-white',
      category: 'bg-primary text-white',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-xs',
      lg: 'px-3 py-1.5 text-sm',
    };

    return (
      <span
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Trending Badge with fire emoji
export interface TrendingBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  children?: React.ReactNode;
}

const TrendingBadge = React.forwardRef<HTMLSpanElement, TrendingBadgeProps>(
  ({ className, children = 'TRENDING', ...props }, ref) => {
    return (
      <Badge
        variant="trending"
        className={cn('animate-pulse', className)}
        ref={ref}
        {...props}
      >
        🔥 {children}
      </Badge>
    );
  }
);

TrendingBadge.displayName = 'TrendingBadge';

// Category Badge with custom colors
export interface CategoryBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  category: string;
  color?: string;
  children?: React.ReactNode;
}

const CategoryBadge = React.forwardRef<HTMLSpanElement, CategoryBadgeProps>(
  ({ className, category, color, children, ...props }, ref) => {
    const getCategoryColor = (cat: string) => {
      const colors: Record<string, string> = {
        'Technology': 'bg-primary',
        'News': 'bg-red',
        'Business': 'bg-green',
        'Science': 'bg-[#5856D6]',
        'Health': 'bg-[#FF9500]',
        'Entertainment': 'bg-[#FF2D92]',
        'Sports': 'bg-[#30B0C7]',
        'Politics': 'bg-gray-medium',
      };
      return colors[cat] || 'bg-primary';
    };

    const categoryColor = color || getCategoryColor(category);

    return (
      <span
        className={cn(
          'inline-flex items-center font-semibold rounded-full text-white px-2.5 py-1 text-xs',
          categoryColor,
          className
        )}
        ref={ref}
        {...props}
      >
        {children || category}
      </span>
    );
  }
);

CategoryBadge.displayName = 'CategoryBadge';

export { Badge, TrendingBadge, CategoryBadge };
