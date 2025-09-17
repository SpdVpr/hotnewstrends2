'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { ArticleCard } from '@/components/ArticleCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Button, Badge } from '@/components/ui';
import { Article, Category } from '@/types';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Categories data
  const categories: Category[] = [
    { id: 'technology', name: 'Technology', slug: 'technology', color: '#007AFF' },
    { id: 'news', name: 'News', slug: 'news', color: '#FF3B30' },
    { id: 'business', name: 'Business', slug: 'business', color: '#34C759' },
    { id: 'science', name: 'Science', slug: 'science', color: '#5856D6' },
    { id: 'health', name: 'Health', slug: 'health', color: '#FF9500' },
    { id: 'entertainment', name: 'Entertainment', slug: 'entertainment', color: '#FF2D92' },
  ];

  // Fetch articles from API
  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '20',
        status: 'published',
        ...(selectedCategory !== 'all' && { category: selectedCategory })
      });

      const response = await fetch(`/api/articles?${params}`);
      if (response.ok) {
        const data = await response.json();

        // API returns { success: true, data: { articles: [], total: 0, ... } }
        const articles = data.data?.articles || data.data || [];
        setArticles(Array.isArray(articles) ? articles : []);
      } else {
        console.error('Failed to fetch articles:', response.statusText);
        setArticles([]);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch articles on component mount and when category changes
  useEffect(() => {
    fetchArticles();
  }, [selectedCategory]);

  // Filter articles based on selected category (client-side backup)
  const filteredArticles = selectedCategory === 'all'
    ? (Array.isArray(articles) ? articles : [])
    : (Array.isArray(articles) ? articles.filter(article =>
        typeof article.category === 'string'
          ? article.category === selectedCategory
          : article.category?.slug === selectedCategory || article.category?.id === selectedCategory
      ) : []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
              Where Speed Meets Style
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              AI-powered newsroom delivering comprehensive articles about trending topics within hours.
              Stay ahead with the fastest, most reliable source for trending news and analysis.
            </p>
          </div>

          {/* Trending Now Banner */}
          {!loading && (
            <div className="bg-gradient-to-r from-orange/10 to-red/10 border border-orange/20 rounded-lg p-4 mb-8">
              <div className="flex items-center justify-center">
                <Badge variant="trending" className="mr-3">
                  🔥 TRENDING NOW
                </Badge>
                <span className="text-text font-medium">
                  {Array.isArray(articles) && articles.filter(article => article.trending).length > 0
                    ? articles.filter(article => article.trending)
                        .slice(0, 4)
                        .map(article => article.title.split(' ').slice(0, 3).join(' '))
                        .join(' • ')
                    : 'Stay tuned for trending topics!'
                  }
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Category Filter */}
        <section className="mb-8">
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </section>

        {/* Articles Grid */}
        <section>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Loading skeleton */}
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-surface rounded-lg p-6 animate-pulse">
                  <div className="h-4 bg-gray-300 rounded mb-4"></div>
                  <div className="h-3 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-300 rounded w-20"></div>
                    <div className="h-3 bg-gray-300 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article, index) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    priority={index < 3} // First 3 articles get priority loading
                  />
                ))}
              </div>

              {!loading && filteredArticles.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-text-secondary text-lg">
                    {selectedCategory === 'all'
                      ? 'No articles found. Check back later for new content!'
                      : `No articles found in the ${categories.find(c => c.id === selectedCategory)?.name || selectedCategory} category.`
                    }
                  </p>
                  {selectedCategory !== 'all' && (
                    <Button
                      variant="primary"
                      className="mt-4"
                      onClick={() => setSelectedCategory('all')}
                    >
                      View All Articles
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        {/* Load More Button - only show if we have articles and not loading */}
        {!loading && filteredArticles.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="primary" size="lg">
              Load More Articles
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-surface mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-primary mb-4">
              HotNewsTrends<span className="text-orange">↗</span>
            </h3>
            <p className="text-text-secondary mb-6">
              Where Speed Meets Style, and Function Meets Beauty.
            </p>
            <div className="flex justify-center space-x-6 text-sm text-text-secondary">
              <a href="#" className="hover:text-primary transition-colors">About</a>
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-primary transition-colors">Contact</a>
            </div>
            <div className="mt-6 text-xs text-text-secondary">
              © 2025 HotNewsTrends.com. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
