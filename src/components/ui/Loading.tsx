import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-light border-t-primary',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  className,
  variant = 'rectangular'
}) => {
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-gray-light',
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label="Loading content"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

interface ArticleCardSkeletonProps {
  className?: string;
}

export const ArticleCardSkeleton: React.FC<ArticleCardSkeletonProps> = ({ 
  className 
}) => {
  return (
    <div className={cn('bg-surface rounded-xl p-6 animate-pulse', className)}>
      {/* Image skeleton */}
      <LoadingSkeleton className="aspect-video w-full mb-4" />
      
      {/* Category badge skeleton */}
      <LoadingSkeleton className="h-6 w-20 mb-3" variant="text" />
      
      {/* Title skeleton */}
      <LoadingSkeleton className="h-6 w-full mb-2" variant="text" />
      <LoadingSkeleton className="h-6 w-3/4 mb-4" variant="text" />
      
      {/* Excerpt skeleton */}
      <LoadingSkeleton className="h-4 w-full mb-2" variant="text" />
      <LoadingSkeleton className="h-4 w-5/6 mb-4" variant="text" />
      
      {/* Meta info skeleton */}
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="h-4 w-24" variant="text" />
        <LoadingSkeleton className="h-4 w-16" variant="text" />
      </div>
    </div>
  );
};

interface PageLoadingProps {
  title?: string;
  description?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({ 
  title = "Loading...",
  description = "Please wait while we load the content."
}) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-text mb-2">{title}</h2>
        <p className="text-text-secondary">{description}</p>
      </div>
    </div>
  );
};

interface ContentLoadingProps {
  rows?: number;
  className?: string;
}

export const ContentLoading: React.FC<ContentLoadingProps> = ({ 
  rows = 3,
  className 
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <LoadingSkeleton 
          key={index}
          className={cn(
            'h-4',
            index === rows - 1 ? 'w-3/4' : 'w-full'
          )}
          variant="text"
        />
      ))}
    </div>
  );
};

interface GridLoadingProps {
  items?: number;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export const GridLoading: React.FC<GridLoadingProps> = ({ 
  items = 6,
  columns = 3,
  className 
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-6', gridClasses[columns], className)}>
      {Array.from({ length: items }).map((_, index) => (
        <ArticleCardSkeleton key={index} />
      ))}
    </div>
  );
};
