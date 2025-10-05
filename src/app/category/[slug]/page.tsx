import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { CategoryBadge } from '@/components/ui/Badge';
import { StructuredData } from '@/components/StructuredData';
import { Button } from '@/components/ui/Button';
import { CategoryArticlesGrid } from '@/components/CategoryArticlesGrid';
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
  {
    id: 'sports',
    name: 'Sports',
    slug: 'sports',
    color: '#FF9500',
    description: 'Sports news, scores, and athletic achievements.'
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
  {
    id: 'sports-1',
    title: "Championship Finals Draw Record-Breaking Viewership",
    excerpt: "The latest championship finals attracted millions of viewers worldwide, setting new records for sports broadcasting.",
    category: mockCategories.find(c => c.slug === 'sports')!,
    readTime: "3 min read",
    trending: true,
    publishedAt: new Date(Date.now() - 1000 * 60 * 45),
    slug: "championship-finals-record-viewership",
    tags: ['Sports', 'Championship', 'Broadcasting'],
    views: 2150,
  },
  {
    id: 'sports-2',
    title: "Olympic Training Methods Revolutionize Athletic Performance",
    excerpt: "New training techniques developed for Olympic athletes are now being adopted by professional sports teams worldwide.",
    category: mockCategories.find(c => c.slug === 'sports')!,
    readTime: "4 min read",
    trending: false,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    slug: "olympic-training-methods-athletic-performance",
    tags: ['Olympics', 'Training', 'Performance'],
    views: 1680,
  },
  // Add more mock articles for different categories
];

async function getCategory(slug: string): Promise<Category | null> {
  try {
    // First try to get from API - use correct URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/categories`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (response.ok) {
      const data = await response.json();
      const categories = data.data || [];
      const category = categories.find((c: Category) => c.slug === slug);
      if (category) {
        console.log(`✅ Found category from API: ${category.name}`);
        return category;
      }
    } else {
      console.error(`❌ Categories API error:`, response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error fetching categories from API:', error);
  }

  // Fallback to mock data
  console.log(`🔄 Using mock category for: ${slug}`);
  const category = mockCategories.find(c => c.slug === slug);
  return category || null;
}

async function getCategoryArticles(categorySlug: string, page: number = 1, limit: number = 24): Promise<{ articles: Article[], total: number, hasMore: boolean }> {
  try {
    // Try to get from API first - use correct port and URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/articles?category=${categorySlug}&limit=${limit}&page=${page}`, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (response.ok) {
      const data = await response.json();
      const articles = data.data?.articles || data.data || [];
      const total = data.data?.total || articles.length;
      const totalPages = data.data?.totalPages || 1;
      const hasMore = page < totalPages;

      console.log(`📊 Found ${articles.length} articles for category: ${categorySlug} (page ${page}/${totalPages})`);
      return { articles, total, hasMore };
    } else {
      console.error(`❌ API error for category ${categorySlug}:`, response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error fetching articles from API:', error);
  }

  // Fallback to mock data
  console.log(`🔄 Using mock data for category: ${categorySlug}`);
  const mockCategoryArticles = mockArticles.filter(a => a.category.slug === categorySlug);
  return {
    articles: mockCategoryArticles,
    total: mockCategoryArticles.length,
    hasMore: false
  };
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

  const { articles, total, hasMore } = await getCategoryArticles(category.slug, 1, 24);

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
              {total} article{total !== 1 ? 's' : ''} found
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
            <CategoryArticlesGrid
              initialArticles={articles}
              categorySlug={category.slug}
              total={total}
              initialHasMore={hasMore}
            />
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
