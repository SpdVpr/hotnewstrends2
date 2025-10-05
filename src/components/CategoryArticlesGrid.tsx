'use client';

import { useState, useEffect } from 'react';
import { ArticleCard } from './ArticleCard';
import { Button } from './ui/Button';
import { Article } from '@/types';

interface CategoryArticlesGridProps {
  initialArticles: Article[];
  categorySlug: string;
  total: number;
  initialHasMore: boolean;
}

export function CategoryArticlesGrid({ 
  initialArticles, 
  categorySlug, 
  total,
  initialHasMore 
}: CategoryArticlesGridProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const nextPage = page + 1;
      const response = await fetch(`/api/articles?category=${categorySlug}&limit=24&page=${nextPage}`);
      
      if (response.ok) {
        const data = await response.json();
        const newArticles = data.data?.articles || data.data || [];
        const totalPages = data.data?.totalPages || 1;
        
        setArticles(prev => [...prev, ...newArticles]);
        setPage(nextPage);
        setHasMore(nextPage < totalPages);
      }
    } catch (error) {
      console.error('Error loading more articles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {articles.map((article, index) => (
          <ArticleCard
            key={article.id}
            article={article}
            priority={index < 6} // First 6 articles get priority loading
          />
        ))}
      </div>
      
      {/* Load More Button */}
      {hasMore && (
        <div className="text-center">
          <p className="text-sm text-text-secondary mb-4">
            Showing {articles.length} of {total} articles
          </p>
          <Button 
            variant="primary" 
            size="lg"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More Articles'}
          </Button>
        </div>
      )}
      
      {!hasMore && articles.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-text-secondary">
            You've reached the end. Showing all {articles.length} articles.
          </p>
        </div>
      )}
    </>
  );
}

