'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Category } from '@/types';

export interface CategoryFilterProps {
  categories: Category[];
  selectedCategory?: string;
  onCategoryChange: (categoryId: string) => void;
  className?: string;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory = 'all',
  onCategoryChange,
  className,
}) => {
  const allCategories = [
    { id: 'all', name: 'All', slug: 'all', color: '#007AFF', description: 'All articles' },
    ...categories,
  ];

  return (
    <div className={cn('flex flex-wrap gap-2 justify-center md:justify-start', className)}>
      {allCategories.map((category) => {
        const isSelected = selectedCategory === category.id;
        
        return (
          <Button
            key={category.id}
            variant={isSelected ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              'rounded-full transition-all duration-200',
              isSelected 
                ? 'shadow-md' 
                : 'hover:shadow-sm hover:scale-105'
            )}
          >
            {category.name}
          </Button>
        );
      })}
    </div>
  );
};

// Horizontal Scrolling Category Filter for mobile
export interface ScrollableCategoryFilterProps extends CategoryFilterProps {
  showScrollIndicators?: boolean;
}

const ScrollableCategoryFilter: React.FC<ScrollableCategoryFilterProps> = ({
  categories,
  selectedCategory = 'all',
  onCategoryChange,
  className,
  showScrollIndicators = true,
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const allCategories = [
    { id: 'all', name: 'All', slug: 'all', color: '#007AFF', description: 'All articles' },
    ...categories,
  ];

  const checkScrollability = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  React.useEffect(() => {
    checkScrollability();
    const handleResize = () => checkScrollability();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [categories]);

  return (
    <div className={cn('relative', className)}>
      {/* Left Scroll Button */}
      {showScrollIndicators && canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-background transition-colors"
          aria-label="Scroll left"
        >
          <svg className="h-4 w-4 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-2"
        onScroll={checkScrollability}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {allCategories.map((category) => {
          const isSelected = selectedCategory === category.id;
          
          return (
            <Button
              key={category.id}
              variant={isSelected ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                'rounded-full whitespace-nowrap flex-shrink-0 transition-all duration-200',
                isSelected 
                  ? 'shadow-md' 
                  : 'hover:shadow-sm hover:scale-105'
              )}
            >
              {category.name}
            </Button>
          );
        })}
      </div>

      {/* Right Scroll Button */}
      {showScrollIndicators && canScrollRight && (
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-background transition-colors"
          aria-label="Scroll right"
        >
          <svg className="h-4 w-4 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
};

export { CategoryFilter, ScrollableCategoryFilter };
