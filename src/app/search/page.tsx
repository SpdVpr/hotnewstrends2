'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { ArticleCard } from '@/components/ArticleCard';
import { SearchInput } from '@/components/ui/Input';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Button } from '@/components/ui/Button';
import { Article, Category } from '@/types';

// Mock data - in real app this would come from database/API
const mockCategories: Category[] = [
  { id: 'technology', name: 'Technology', slug: 'technology', color: '#007AFF' },
  { id: 'news', name: 'News', slug: 'news', color: '#FF3B30' },
  { id: 'business', name: 'Business', slug: 'business', color: '#34C759' },
  { id: 'science', name: 'Science', slug: 'science', color: '#5856D6' },
  { id: 'health', name: 'Health', slug: 'health', color: '#FF9500' },
];

const mockArticles: Article[] = [
  {
    id: '1',
    title: "AI Revolution Transforms Digital Marketing Landscape",
    excerpt: "Latest developments in artificial intelligence are reshaping how businesses approach digital marketing, with new tools emerging daily.",
    category: mockCategories[0],
    readTime: "3 min read",
    trending: true,
    publishedAt: new Date(Date.now() - 1000 * 60 * 30),
    slug: "ai-revolution-transforms-digital-marketing-landscape",
    tags: ['AI', 'Marketing', 'Technology'],
    views: 1250,
  },
  {
    id: '2',
    title: "Climate Summit Reaches Historic Agreement",
    excerpt: "World leaders unite on groundbreaking climate initiatives that could reshape global environmental policy for decades.",
    category: mockCategories[1],
    readTime: "5 min read",
    trending: true,
    publishedAt: new Date(Date.now() - 1000 * 60 * 45),
    slug: "climate-summit-reaches-historic-agreement",
    tags: ['Climate', 'Politics', 'Environment'],
    views: 2100,
  },
  {
    id: '3',
    title: "Breakthrough in Quantum Computing Announced",
    excerpt: "Scientists achieve new milestone in quantum computing that brings us closer to practical quantum applications.",
    category: mockCategories[0],
    readTime: "4 min read",
    trending: false,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    slug: "breakthrough-in-quantum-computing-announced",
    tags: ['Quantum', 'Computing', 'Science'],
    views: 890,
  },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Simulate search functionality
  const performSearch = async (query: string, category: string) => {
    setIsLoading(true);
    setHasSearched(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let results = mockArticles;
    
    // Filter by search query
    if (query.trim()) {
      results = results.filter(article =>
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(query.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    // Filter by category
    if (category !== 'all') {
      results = results.filter(article => article.category.id === category);
    }
    
    setSearchResults(results);
    setIsLoading(false);
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    performSearch(query, selectedCategory);
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    performSearch(searchQuery, category);
  };

  // Initial search if query parameter exists
  useEffect(() => {
    const initialQuery = searchParams.get('q');
    if (initialQuery) {
      setSearchQuery(initialQuery);
      performSearch(initialQuery, selectedCategory);
    }
  }, [searchParams, selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-text mb-6">
            Search Articles
          </h1>
          
          {/* Search Input */}
          <div className="max-w-2xl mb-8">
            <SearchInput
              placeholder="Search for articles, topics, or keywords..."
              onSearch={handleSearch}
              value={searchQuery}
              className="w-full"
            />
          </div>
          
          {/* Category Filter */}
          <div className="mb-6">
            <CategoryFilter
              categories={mockCategories}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>
          
          {/* Search Info */}
          {hasSearched && (
            <div className="flex items-center justify-between text-sm text-text-secondary">
              <p>
                {isLoading ? (
                  'Searching...'
                ) : (
                  <>
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                    {searchQuery && ` for "${searchQuery}"`}
                    {selectedCategory !== 'all' && ` in ${mockCategories.find(c => c.id === selectedCategory)?.name}`}
                  </>
                )}
              </p>
              
              {!isLoading && searchResults.length > 0 && (
                <select className="px-3 py-1 border border-gray-light rounded text-sm bg-white">
                  <option value="relevance">Most Relevant</option>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="popular">Most Popular</option>
                </select>
              )}
            </div>
          )}
        </header>

        {/* Search Results */}
        {isLoading ? (
          /* Loading State */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-surface rounded-xl p-6 animate-pulse">
                <div className="aspect-video bg-gray-light rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-light rounded mb-2"></div>
                <div className="h-4 bg-gray-light rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-light rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : hasSearched ? (
          searchResults.length > 0 ? (
            /* Results Found */
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {searchResults.map((article, index) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    priority={index < 6}
                  />
                ))}
              </div>
              
              {/* Load More */}
              {searchResults.length >= 6 && (
                <div className="text-center">
                  <Button variant="primary" size="lg">
                    Load More Results
                  </Button>
                </div>
              )}
            </section>
          ) : (
            /* No Results */
            <div className="text-center py-16">
              <div className="mb-8">
                <svg 
                  className="mx-auto h-24 w-24 text-text-secondary mb-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
                <h2 className="text-2xl font-bold text-text mb-4">No Results Found</h2>
                <p className="text-text-secondary max-w-md mx-auto">
                  We couldn't find any articles matching your search. 
                  Try different keywords or browse our categories.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setHasSearched(false);
                  }}
                >
                  Clear Search
                </Button>
                <Button variant="secondary" size="lg">
                  Browse All Articles
                </Button>
              </div>
            </div>
          )
        ) : (
          /* Initial State */
          <div className="text-center py-16">
            <div className="mb-8">
              <svg 
                className="mx-auto h-24 w-24 text-text-secondary mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
              <h2 className="text-2xl font-bold text-text mb-4">Discover Trending Content</h2>
              <p className="text-text-secondary max-w-md mx-auto">
                Search through our collection of trending articles, breaking news, and in-depth analysis.
              </p>
            </div>
            
            {/* Popular Search Terms */}
            <div className="max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-text mb-4">Popular Searches</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {['AI', 'Climate Change', 'Technology', 'Business', 'Health', 'Science'].map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="px-4 py-2 bg-surface text-text rounded-full text-sm hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-surface rounded w-1/3 mb-4"></div>
            <div className="h-12 bg-surface rounded mb-8"></div>
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
        </main>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
