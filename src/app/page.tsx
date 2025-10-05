'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { ArticleCard } from '@/components/ArticleCard';
import { CategoryFilter, ScrollableCategoryFilter } from '@/components/CategoryFilter';
import { Button, Badge } from '@/components/ui';
import { Article, Category } from '@/types';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [currentTrendIndex, setCurrentTrendIndex] = useState(0);

  // Categories data - matching Firebase structure
  const categories: Category[] = [
    { id: 'news', name: 'News', slug: 'news', color: '#FF3B30' },
    { id: 'technology', name: 'Technology', slug: 'technology', color: '#007AFF' },
    { id: 'business', name: 'Business', slug: 'business', color: '#34C759' },
    { id: 'sports', name: 'Sports', slug: 'sports', color: '#FF9500' },
    { id: 'health', name: 'Health', slug: 'health', color: '#5856D6' },
    { id: 'entertainment', name: 'Entertainment', slug: 'entertainment', color: '#FF2D92' },
  ];

  // Fetch trending topics from Firebase
  const fetchTrendingTopics = async () => {
    try {
      const response = await fetch('/api/trends?source=firebase&limit=10');
      if (response.ok) {
        const data = await response.json();
        const topics = data.data?.topics || [];
        const topicNames = topics.map((topic: any) => topic.keyword || topic.title).filter(Boolean);
        setTrendingTopics(topicNames.slice(0, 8)); // Max 8 topics for rotation
      }
    } catch (error) {
      console.error('Error fetching trending topics:', error);
    }
  };

  // Fetch articles from API
  const fetchArticles = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      // Fetch articles with pagination
      const params = new URLSearchParams({
        limit: '24', // 24 articles per page (same as categories)
        page: pageNum.toString(),
        status: 'published'
      });

      // Add category filter if not 'all'
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      console.log('🌐 API call params:', { selectedCategory, page: pageNum, params: params.toString() });
      const response = await fetch(`/api/articles?${params}`);
      if (response.ok) {
        const data = await response.json();

        // API returns { success: true, data: { articles: [], total: 0, totalPages: 0, ... } }
        const newArticles = data.data?.articles || data.data || [];
        const totalCount = data.data?.total || 0;
        const totalPages = data.data?.totalPages || 1;

        console.log('📦 API returned:', {
          articles: newArticles.length,
          total: totalCount,
          page: pageNum,
          totalPages
        });

        if (append) {
          setArticles(prev => [...prev, ...newArticles]);
        } else {
          setArticles(Array.isArray(newArticles) ? newArticles : []);
        }

        setTotal(totalCount);
        setHasMore(pageNum < totalPages);
        setPage(pageNum);
      } else {
        console.error('Failed to fetch articles:', response.statusText);
        if (!append) {
          setArticles([]);
        }
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      if (!append) {
        setArticles([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more articles
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchArticles(page + 1, true);
    }
  };

  // Fetch articles on component mount and when category changes
  useEffect(() => {
    // Reset to page 1 when category changes
    setPage(1);
    setHasMore(true);
    fetchArticles(1, false);
  }, [selectedCategory]);

  // Fetch trending topics on component mount
  useEffect(() => {
    fetchTrendingTopics();
    // Refresh trending topics every 5 minutes
    const interval = setInterval(fetchTrendingTopics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Animate trending topics rotation
  useEffect(() => {
    if (trendingTopics.length > 1) {
      const interval = setInterval(() => {
        setCurrentTrendIndex((prev) => (prev + 1) % trendingTopics.length);
      }, 3000); // Change every 3 seconds
      return () => clearInterval(interval);
    }
  }, [trendingTopics.length]);

  // No need for client-side filtering anymore - API handles it
  const displayArticles = Array.isArray(articles) ? articles : [];

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
              Latest Breaking News & Trending Topics Today
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Your trusted source for breaking news, trending stories, and in-depth analysis.
              Get the latest updates on technology, business, entertainment, health, and world events as they happen.
            </p>
          </div>

          {/* Trending Now Banner */}
          {!loading && (
            <div className="bg-gradient-to-r from-orange/10 to-red/10 border border-orange/20 rounded-lg p-3 md:p-4 mb-8">
              <div className="flex items-center justify-center flex-col sm:flex-row gap-2 sm:gap-0">
                <Badge variant="trending" className="mr-0 sm:mr-3 mb-1 sm:mb-0 text-xs sm:text-sm">
                  🔥 TRENDING NOW
                </Badge>
                <div className="text-text font-medium min-h-[24px] flex items-center text-sm sm:text-base text-center">
                  {trendingTopics.length > 0 ? (
                    <div className="relative overflow-hidden">
                      <div
                        className="transition-transform duration-500 ease-in-out"
                        style={{
                          transform: `translateY(-${currentTrendIndex * 24}px)`,
                          height: '24px'
                        }}
                      >
                        {trendingTopics.map((topic, index) => (
                          <div
                            key={index}
                            className="h-6 flex items-center capitalize justify-center"
                            style={{ lineHeight: '24px' }}
                          >
                            {topic}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="text-center">Loading trending topics...</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Category Filter */}
        <section className="mb-8">
          {/* Mobile: Scrollable horizontal filter */}
          <div className="block md:hidden">
            <ScrollableCategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              showScrollIndicators={true}
            />
          </div>

          {/* Desktop: Regular flex filter */}
          <div className="hidden md:block">
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {displayArticles.map((article, index) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    priority={index < 6} // First 6 articles get priority loading
                  />
                ))}
              </div>

              {!loading && displayArticles.length === 0 && (
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

              {/* Load More Button */}
              {!loading && displayArticles.length > 0 && hasMore && (
                <div className="text-center">
                  <p className="text-sm text-text-secondary mb-4">
                    Showing {displayArticles.length} of {total} articles
                  </p>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading...' : 'Load More Articles'}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
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
              <Link href="/about" className="hover:text-primary transition-colors">About</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
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
