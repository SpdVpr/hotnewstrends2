import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { ArticleCard } from '@/components/ArticleCard';
import { CategoryBadge } from '@/components/ui/Badge';
import { StructuredData } from '@/components/StructuredData';
import { Button } from '@/components/ui/Button';
import { Article, Category } from '@/types';

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

// Mock data - in real app this would come from database/API
const mockCategories: Category[] = [
  { 
    id: 'technology', 
    name: 'Technology', 
    slug: 'technology', 
    color: '#007AFF',
    description: 'Latest developments in technology, AI, software, and digital innovation.'
  },
  { 
    id: 'news', 
    name: 'News', 
    slug: 'news', 
    color: '#FF3B30',
    description: 'Breaking news and current events from around the world.'
  },
  { 
    id: 'business', 
    name: 'Business', 
    slug: 'business', 
    color: '#34C759',
    description: 'Business insights, market analysis, and entrepreneurship stories.'
  },
  { 
    id: 'science', 
    name: 'Science', 
    slug: 'science', 
    color: '#5856D6',
    description: 'Scientific discoveries, research breakthroughs, and space exploration.'
  },
  {
    id: 'health',
    name: 'Health',
    slug: 'health',
    color: '#FF9500',
    description: 'Health and wellness news, medical breakthroughs, and lifestyle tips.'
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    slug: 'entertainment',
    color: '#FF2D92',
    description: 'Movies, TV shows, celebrities, and pop culture news.'
  },
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
  // Add more mock articles for different categories
];

async function getCategory(slug: string): Promise<Category | null> {
  try {
    // First try to get from API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'}/api/categories`);
    if (response.ok) {
      const data = await response.json();
      const categories = data.data || [];
      const category = categories.find((c: Category) => c.slug === slug);
      if (category) return category;
    }
  } catch (error) {
    console.error('Error fetching categories from API:', error);
  }

  // Fallback to mock data
  const category = mockCategories.find(c => c.slug === slug);
  return category || null;
}

async function getCategoryArticles(categorySlug: string): Promise<Article[]> {
  try {
    // Try to get from API first
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'}/api/articles?category=${categorySlug}&limit=50`);
    if (response.ok) {
      const data = await response.json();
      const articles = data.data?.articles || data.data || [];
      return articles;
    }
  } catch (error) {
    console.error('Error fetching articles from API:', error);
  }

  // Fallback to mock data
  return mockArticles.filter(a => a.category.slug === categorySlug);
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  
  if (!category) {
    return {
      title: 'Category Not Found | TrendyBlogger',
      description: 'The requested category could not be found.',
    };
  }

  const canonicalUrl = `https://hotnewstrends.com/category/${category.slug}`;

  return {
    title: `${category.name} Articles | HotNewsTrends`,
    description: category.description || `Latest ${category.name.toLowerCase()} articles and trending topics from HotNewsTrends.`,
    keywords: `${category.name.toLowerCase()}, trending ${category.name.toLowerCase()}, ${category.name.toLowerCase()} news, hotnewstrends`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${category.name} | HotNewsTrends`,
      description: category.description || `Latest ${category.name.toLowerCase()} articles and trending topics.`,
      type: 'website',
      url: canonicalUrl,
      siteName: 'HotNewsTrends',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} | HotNewsTrends`,
      description: category.description || `Latest ${category.name.toLowerCase()} articles and trending topics.`,
    },
    robots: 'index, follow',
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategory(slug);
  
  if (!category) {
    notFound();
  }

  const articles = await getCategoryArticles(category.slug);

  return (
    <div className="min-h-screen bg-background">
      <StructuredData type="category" category={category.name} />
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-text-secondary mb-8">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>›</span>
          <span className="text-text">{category.name}</span>
        </nav>

        {/* Category Header */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <CategoryBadge category={category.name} />
            <h1 className="text-3xl md:text-4xl font-bold text-text">
              {category.name}
            </h1>
          </div>
          
          {category.description && (
            <p className="text-lg text-text-secondary max-w-3xl">
              {category.description}
            </p>
          )}
          
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              {articles.length} article{articles.length !== 1 ? 's' : ''} found
            </p>
            
            {/* Sort/Filter Options */}
            <div className="flex items-center gap-4">
              <select className="px-3 py-2 border border-gray-light rounded-lg text-sm bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="trending">Most Trending</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        </header>

        {/* Articles Grid */}
        {articles.length > 0 ? (
          <section>
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
            <div className="text-center">
              <Button variant="primary" size="lg">
                Load More Articles
              </Button>
            </div>
          </section>
        ) : (
          /* Empty State */
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
              <h2 className="text-2xl font-bold text-text mb-4">No Articles Yet</h2>
              <p className="text-text-secondary max-w-md mx-auto">
                We're working on bringing you the latest {category.name.toLowerCase()} content. 
                Check back soon for trending articles in this category.
              </p>
            </div>
            
            <div className="flex justify-center">
              <Link href="/">
                <Button variant="primary" size="lg">
                  Explore All Articles
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Related Categories */}
        <section className="mt-16 pt-12 border-t border-surface">
          <h2 className="text-2xl font-bold text-text mb-8">Explore Other Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mockCategories
              .filter(c => c.slug !== category.slug)
              .map((relatedCategory) => (
                <Link
                  key={relatedCategory.id}
                  href={`/category/${relatedCategory.slug}`}
                  className="group p-6 bg-surface rounded-xl hover:bg-primary/5 transition-colors"
                >
                  <CategoryBadge 
                    category={relatedCategory.name} 
                    className="mb-3"
                  />
                  <h3 className="font-semibold text-text group-hover:text-primary transition-colors">
                    {relatedCategory.name}
                  </h3>
                  <p className="text-sm text-text-secondary mt-2">
                    {relatedCategory.description}
                  </p>
                </Link>
              ))}
          </div>
        </section>
      </main>
    </div>
  );
}
