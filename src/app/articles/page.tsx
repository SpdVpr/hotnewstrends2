'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CompactArticleCard } from '@/components/ArticleCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Article } from '@/types';

function ArticlesContent() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const tagFilter = searchParams.get('tag');
  const categoryFilter = searchParams.get('category');

  useEffect(() => {
    fetchArticles();
  }, [tagFilter, categoryFilter]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = '/api/articles?limit=20&status=published';
      
      if (categoryFilter) {
        url += `&category=${encodeURIComponent(categoryFilter)}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }

      const data = await response.json();
      let fetchedArticles = data.data || [];

      // Filter by tag on client side if needed
      if (tagFilter) {
        fetchedArticles = fetchedArticles.filter((article: Article) =>
          article.tags?.some(tag => 
            tag.toLowerCase() === tagFilter.toLowerCase()
          )
        );
      }

      setArticles(fetchedArticles);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    window.location.href = '/articles';
  };

  const getPageTitle = () => {
    if (tagFilter) {
      return `Articles tagged with "${tagFilter}"`;
    }
    if (categoryFilter) {
      return `Articles in "${categoryFilter}"`;
    }
    return 'All Articles';
  };

  const getPageDescription = () => {
    if (tagFilter) {
      return `Browse all articles tagged with "${tagFilter}". Stay updated with the latest trends and insights.`;
    }
    if (categoryFilter) {
      return `Explore articles in the "${categoryFilter}" category. Discover trending topics and expert analysis.`;
    }
    return 'Browse all articles on TrendyBlogger. Stay updated with the latest trends, news, and insights across all categories.';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-surface rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-surface rounded w-2/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-surface rounded-xl p-6">
                  <div className="h-48 bg-background rounded-lg mb-4"></div>
                  <div className="h-4 bg-background rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-background rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text mb-4">Error Loading Articles</h1>
            <p className="text-text-secondary mb-6">{error}</p>
            <Button onClick={fetchArticles} variant="primary">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-4">
            {getPageTitle()}
          </h1>
          <p className="text-text-secondary text-lg mb-6">
            {getPageDescription()}
          </p>

          {/* Active Filters */}
          {(tagFilter || categoryFilter) && (
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="text-sm text-text-secondary">Active filters:</span>
              {tagFilter && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  Tag: {tagFilter}
                </Badge>
              )}
              {categoryFilter && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  Category: {categoryFilter}
                </Badge>
              )}
              <Button 
                onClick={clearFilters} 
                variant="ghost" 
                size="sm"
                className="text-text-secondary hover:text-text"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>

        {/* Articles Grid */}
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <CompactArticleCard
                key={article.id}
                article={article}
                showImage={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-text mb-4">
              No articles found
            </h2>
            <p className="text-text-secondary mb-6">
              {tagFilter || categoryFilter 
                ? "Try adjusting your filters or browse all articles."
                : "No articles are available at the moment."
              }
            </p>
            {(tagFilter || categoryFilter) && (
              <Button onClick={clearFilters} variant="primary">
                View All Articles
              </Button>
            )}
          </div>
        )}

        {/* Load More Button (for future pagination) */}
        {articles.length >= 20 && (
          <div className="text-center mt-12">
            <Button variant="secondary" size="lg">
              Load More Articles
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ArticlesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-surface rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-surface rounded w-2/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-surface rounded-xl p-6">
                  <div className="h-48 bg-background rounded-lg mb-4"></div>
                  <div className="h-4 bg-background rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-background rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <ArticlesContent />
    </Suspense>
  );
}
