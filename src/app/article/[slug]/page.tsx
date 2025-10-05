import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { TrendingBadge, CategoryBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CompactArticleCard } from '@/components/ArticleCard';
import { StructuredData } from '@/components/StructuredData';
import { formatRelativeTime, formatDate } from '@/lib/utils';
import { Article, Category } from '@/types';
import { firebaseArticlesService } from '@/lib/services/firebase-articles';

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

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
    content: `
# AI Revolution Transforms Digital Marketing Landscape

The digital marketing world is experiencing an unprecedented transformation as artificial intelligence technologies continue to evolve at breakneck speed. From automated content creation to predictive analytics, AI is fundamentally changing how businesses connect with their audiences.

## The Current State of AI in Marketing

Marketing professionals are increasingly turning to AI-powered tools to streamline their workflows and enhance campaign effectiveness. Machine learning algorithms now analyze consumer behavior patterns with remarkable accuracy, enabling marketers to create highly personalized experiences.

### Key Areas of Impact

**Content Creation and Optimization**
- Automated copywriting tools generate compelling ad copy and social media posts
- AI-powered design platforms create visual content at scale
- Dynamic content optimization adjusts messaging in real-time

**Customer Segmentation and Targeting**
- Advanced algorithms identify micro-segments within customer bases
- Predictive modeling forecasts customer lifetime value
- Behavioral analysis enables precise targeting strategies

**Performance Analytics**
- Real-time campaign optimization based on performance data
- Attribution modeling across multiple touchpoints
- Automated A/B testing and result analysis

## Industry Leaders Embrace AI

Major brands are already seeing significant returns on their AI investments. Companies report up to 40% improvements in campaign performance and 60% reductions in content creation time.

The technology is becoming more accessible to smaller businesses as well, with affordable AI tools democratizing advanced marketing capabilities that were once exclusive to enterprise-level organizations.

## Looking Ahead

As AI continues to mature, we can expect even more sophisticated applications in marketing. The integration of AI with emerging technologies like augmented reality and voice assistants will create new opportunities for brand engagement.

The future of digital marketing is undoubtedly AI-driven, and businesses that adapt quickly will gain a significant competitive advantage in the evolving landscape.
    `,
    category: mockCategories[0],
    readTime: "3 min read",
    trending: true,
    publishedAt: new Date(Date.now() - 1000 * 60 * 30),
    slug: "ai-revolution-transforms-digital-marketing-landscape",
    tags: ['AI', 'Marketing', 'Technology'],
    views: 1250,
    likes: 89,
    author: "Sarah Chen",
    seoTitle: "AI Revolution in Digital Marketing 2025 | TrendyBlogger",
    seoDescription: "Discover how AI is transforming digital marketing with automated content creation, predictive analytics, and personalized customer experiences."
  },
  // Add more mock articles for related content
];

function formatArticleContent(content: string): string {
  if (!content) return '';

  // First, convert markdown formatting BEFORE HTML processing
  let formattedContent = content
    // AGGRESSIVE cleanup of excessive newlines
    .replace(/\n{4,}/g, '\n\n') // Reduce 4+ newlines to just 2
    .replace(/\n{3}/g, '\n\n') // Reduce 3 newlines to 2
    .replace(/\n+(<div|<table)/g, '\n$1') // Remove extra newlines before tables/divs
    .replace(/(<\/div>|<\/table>)\n+/g, '$1\n\n') // Normalize newlines after tables/divs
    // Clean up spaces and tabs that might cause issues
    .replace(/[ \t]+\n/g, '\n') // Remove trailing spaces/tabs before newlines
    .replace(/\n[ \t]+/g, '\n') // Remove leading spaces/tabs after newlines

    // Convert markdown headers FIRST (before paragraph processing)
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-gray-900 mt-8 mb-6">$1</h1>')

    // Convert markdown formatting
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline font-medium">$1</a>'
    );

  // Check if content already contains HTML (from structured data processing)
  const hasHtml = /<[^>]+>/.test(formattedContent);

  if (hasHtml) {
    // Content has HTML formatting, process paragraphs carefully
    formattedContent = formattedContent
      // Split by double newlines to create paragraphs, but preserve existing HTML
      .split('\n\n')
      .map(paragraph => {
        paragraph = paragraph.trim();
        if (!paragraph) return '';

        // If paragraph already starts with HTML tag, don't wrap it and don't add <br>
        if (paragraph.match(/^<(h[1-6]|div|table|ul|ol|blockquote)/i)) {
          return paragraph;
        }

        // If paragraph contains only HTML tags, don't wrap
        if (paragraph.match(/^<[^>]+>.*<\/[^>]+>$/)) {
          return paragraph;
        }

        // For regular text paragraphs, be careful with <br> conversion
        // Only convert single \n to <br>, not multiple ones
        const cleanParagraph = paragraph.replace(/\n+/g, '\n'); // Reduce multiple \n to single
        return `<p class="mb-4">${cleanParagraph.replace(/\n/g, '<br>')}</p>`;
      })
      .filter(p => p) // Remove empty paragraphs
      .join('\n')
      // AGGRESSIVE cleanup - remove excessive <br> tags
      .replace(/(<br>\s*){4,}/g, '<br><br>') // Max 2 <br> in a row
      .replace(/(<br>\s*){3}/g, '<br><br>') // Reduce 3 <br> to 2
      .replace(/(<br>\s*){2,}\s*(<div|<table|<h[1-6])/g, '$2') // Remove all <br> before block elements
      .replace(/(<\/div>|<\/table>|<\/h[1-6]>)\s*(<br>\s*){1,}/g, '$1') // Remove all <br> after block elements
      .replace(/<br>\s*<br>\s*<br>/g, '<br><br>') // Final pass to ensure max 2 <br>
      .replace(/^\s*(<br>\s*)+/g, '') // Remove <br> at the very beginning
      .replace(/(<br>\s*)+\s*$/g, ''); // Remove <br> at the very end
  } else {
    // Simple text content, convert to HTML paragraphs
    formattedContent = formattedContent
      .split('\n\n')
      .map(paragraph => {
        paragraph = paragraph.trim();
        if (!paragraph) return '';
        // For simple text, also be careful with <br>
        const cleanParagraph = paragraph.replace(/\n+/g, '\n');
        return `<p class="mb-4">${cleanParagraph.replace(/\n/g, '<br>')}</p>`;
      })
      .filter(p => p)
      .join('\n');
  }

  return formattedContent;
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    // Use getArticleBySlug to fetch article directly by slug (efficient indexed query)
    console.log(`🔍 Looking for article with slug: "${slug}"`);

    const article = await firebaseArticlesService.getArticleBySlug(slug);

    if (article) {
      console.log(`✅ Found article: "${article.title}" with slug: "${article.slug}"`);
      console.log(`📅 Article dates:`, {
        publishedAt: article.publishedAt,
        createdAt: article.createdAt,
        publishedAtType: typeof article.publishedAt,
        createdAtType: typeof article.createdAt
      });

      // Convert Firebase article to Article type
      return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        author: article.author,
        category: article.category,
        tags: Array.isArray(article.tags) ? article.tags : (typeof article.tags === 'string' ? article.tags.split(' ') : []),
        publishedAt: article.publishedAt,
        readTime: article.readTime,
        views: article.views,
        likes: article.likes,
        trending: article.trending,
        featured: article.featured,
        image: article.image,
        imageSource: article.imageSource,
        imageAlt: article.imageAlt,
        seoTitle: article.seoTitle,
        seoDescription: article.seoDescription
      };
    }

    console.log(`❌ Article not found in Firebase for slug: ${slug}`);

    // Fallback to mock data if not found in Firebase
    const mockArticle = mockArticles.find(a => a.slug === slug);
    return mockArticle || null;
  } catch (error) {
    console.error('Error fetching article:', error);
    // Fallback to mock data on error
    const mockArticle = mockArticles.find(a => a.slug === slug);
    return mockArticle || null;
  }
}

async function getRelatedArticles(currentSlug: string, category: string): Promise<Article[]> {
  try {
    // Get related articles from Firebase
    const articles = await firebaseArticlesService.getArticles({
      limit: 6,
      status: 'published',
      category: category
    });

    const relatedArticles = articles
      .filter(a => a.slug !== currentSlug)
      .slice(0, 3)
      .map(article => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        author: article.author,
        category: article.category,
        tags: article.tags,
        publishedAt: article.publishedAt,
        readTime: article.readTime,
        views: article.views,
        likes: article.likes,
        trending: article.trending,
        featured: article.featured,
        image: article.image,
        imageSource: article.imageSource,
        imageAlt: article.imageAlt,
        seoTitle: article.seoTitle,
        seoDescription: article.seoDescription
      }));

    // If we have related articles from Firebase, return them
    if (relatedArticles.length > 0) {
      return relatedArticles;
    }

    // Fallback to mock articles
    return mockArticles.filter(a =>
      a.slug !== currentSlug &&
      a.category.slug === category
    ).slice(0, 3);
  } catch (error) {
    console.error('Error fetching related articles:', error);
    // Fallback to mock articles on error
    return mockArticles.filter(a =>
      a.slug !== currentSlug &&
      a.category.slug === category
    ).slice(0, 3);
  }
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  
  if (!article) {
    return {
      title: 'Article Not Found | TrendyBlogger',
      description: 'The requested article could not be found.',
    };
  }

  return {
    title: article.seoTitle || `${article.title} | TrendyBlogger`,
    description: article.seoDescription || article.excerpt,
    keywords: article.tags.join(', '),
    authors: [{ name: article.author || 'TrendyBlogger' }],
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.publishedAt.toISOString(),
      authors: [article.author || 'TrendyBlogger'],
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);
  
  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedArticles(article.slug, article.category.slug);

  return (
    <div className="min-h-screen bg-background">
      <StructuredData type="newsarticle" data={article} />
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-text-secondary mb-8">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>›</span>
          <Link 
            href={`/category/${article.category.slug}`}
            className="hover:text-primary transition-colors"
          >
            {article.category.name}
          </Link>
          <span>›</span>
          <span className="text-text">{article.title}</span>
        </nav>

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <CategoryBadge category={article.category.name} />
            {article.trending && <TrendingBadge />}
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text mb-4 leading-tight">
            {article.title}
          </h1>
          
          <p className="text-lg text-text-secondary mb-6 leading-relaxed">
            {article.excerpt}
          </p>
          
          <div className="flex items-center justify-between flex-wrap gap-4 py-4 border-t border-b border-surface">
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              {article.author && (
                <span className="font-medium text-text">By {article.author}</span>
              )}
              <span>{formatDate(article.publishedAt || article.createdAt)}</span>
              <span>{article.readTime}</span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              {article.views && (
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {article.views.toLocaleString()} views
                </span>
              )}
              {article.likes && (
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {article.likes} likes
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Article Image */}
        {article.image && (
          <div className="mb-8">
            <div className="relative aspect-video bg-surface rounded-xl overflow-hidden">
              {/* Use regular img tag for external images to avoid Next.js domain restrictions */}
              <img
                src={article.image}
                alt={article.imageAlt || article.title}
                className="w-full h-full object-cover"
              />
            </div>
            {article.imageSource && (
              <p className="text-xs text-text-secondary mt-2 text-center">
                Image source: {article.imageSource.startsWith('http') ? (
                  <a
                    href={article.imageSource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {new URL(article.imageSource).hostname}
                  </a>
                ) : (
                  <span>{article.imageSource}</span>
                )}
              </p>
            )}
          </div>
        )}

        {/* Article Content */}
        <article className="mb-12">
          <div className="prose prose-lg prose-gray max-w-none">
            <div
              className="text-text leading-relaxed space-y-6"
              style={{
                fontSize: '18px',
                lineHeight: '1.8',
                color: '#374151'
              }}
              dangerouslySetInnerHTML={{
                __html: formatArticleContent(article.content || '')
              }}
            />
          </div>
        </article>

        {/* Tags - Only show relevant, user-friendly tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mb-12 border-t border-surface pt-8">
            <h3 className="text-lg font-semibold text-text mb-4">Related Topics</h3>
            <div className="flex flex-wrap gap-3">
              {article.tags
                .filter(tag =>
                  !['trending', 'news', 'analysis', 'seo', 'optimization'].includes(tag.toLowerCase()) &&
                  tag.length > 2
                )
                .slice(0, 8)
                .map((tag) => (
                  <a
                    key={tag}
                    href={`/articles?tag=${encodeURIComponent(tag.toLowerCase())}`}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200 capitalize"
                  >
                    #{tag.replace(/[-_]/g, ' ')}
                  </a>
                ))}
            </div>
          </div>
        )}

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="border-t border-surface pt-12">
            <h2 className="text-2xl font-bold text-text mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.map((relatedArticle) => (
                <CompactArticleCard
                  key={relatedArticle.id}
                  article={relatedArticle}
                  showImage={false}
                />
              ))}
            </div>
          </section>
        )}


      </main>
    </div>
  );
}
