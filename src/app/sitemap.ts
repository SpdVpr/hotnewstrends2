import { MetadataRoute } from 'next';

// Get articles from Firebase API
async function getArticles() {
  try {
    // Try to get articles from API
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/articles?limit=1000`, {
      next: { revalidate: 300 } // Cache for 5 minutes - faster indexing of new articles
    });

    if (response.ok) {
      const data = await response.json();
      const articles = data.data?.articles || data.data || [];
      console.log(`📄 Found ${articles.length} articles for sitemap`);

      return articles.map((article: any) => ({
        slug: article.slug,
        publishedAt: new Date(article.publishedAt),
        updatedAt: article.updatedAt ? new Date(article.updatedAt) : new Date(article.publishedAt),
        category: article.category?.slug || 'general'
      }));
    } else {
      console.warn('❌ Failed to fetch articles from API for sitemap');
    }
  } catch (error) {
    console.error('Error fetching articles for sitemap:', error);
  }

  // Return empty array if no articles found
  return [];
}

// Mock categories - in production, fetch from database
const mockCategories = [
  { slug: 'technology' },
  { slug: 'news' },
  { slug: 'business' },
  { slug: 'entertainment' },
  { slug: 'science' },
  { slug: 'health' },
  { slug: 'sports' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hotnewstrends.com';

    // Get articles from API
    const articles = await getArticles();
    console.log(`📄 Generating sitemap with ${articles.length} articles`);

    // Static pages with dynamic priorities based on importance
    const staticPages = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'hourly' as const,
        priority: 1.0,
      },
      {
        url: `${baseUrl}/articles`,
        lastModified: new Date(),
        changeFrequency: 'hourly' as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      },
      {
        url: `${baseUrl}/privacy`,
        lastModified: new Date(),
        changeFrequency: 'yearly' as const,
        priority: 0.3,
      },
      {
        url: `${baseUrl}/terms`,
        lastModified: new Date(),
        changeFrequency: 'yearly' as const,
        priority: 0.3,
      },
    ];

      // Category pages with dynamic last modified based on latest article
      const categoryPages = mockCategories.map((category) => {
        const categoryArticles = articles.filter(a => a.category === category.slug);
        const latestArticle = categoryArticles.sort((a, b) =>
          b.publishedAt.getTime() - a.publishedAt.getTime()
        )[0];

        return {
          url: `${baseUrl}/category/${category.slug}`,
          lastModified: latestArticle?.publishedAt || new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.8,
        };
      });

      // Article pages with dynamic priorities based on recency and category
      const articlePages = articles.map((article) => {
        const daysSincePublished = (Date.now() - article.publishedAt.getTime()) / (1000 * 60 * 60 * 24);

        // Higher priority for newer articles
        let priority = 0.9;
        if (daysSincePublished > 30) priority = 0.7;
        if (daysSincePublished > 90) priority = 0.5;

        // Boost priority for trending categories
        const trendingCategories = ['technology', 'news'];
        if (trendingCategories.includes(article.category)) {
          priority = Math.min(1.0, priority + 0.1);
        }

        return {
          url: `${baseUrl}/article/${article.slug}`,
          lastModified: article.updatedAt,
          changeFrequency: daysSincePublished < 7 ? 'daily' as const : 'weekly' as const,
          priority,
        };
      });

    console.log(`📄 Generated sitemap with ${staticPages.length + categoryPages.length + articlePages.length} URLs`);

    return [
      ...staticPages,
      ...categoryPages,
      ...articlePages,
    ];

  } catch (error) {
    console.error('❌ Error generating sitemap:', error);

    // Return minimal sitemap with just static pages if there's an error
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hotnewstrends.com';
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'hourly' as const,
        priority: 1.0,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      },
      {
        url: `${baseUrl}/privacy`,
        lastModified: new Date(),
        changeFrequency: 'yearly' as const,
        priority: 0.3,
      },
      {
        url: `${baseUrl}/terms`,
        lastModified: new Date(),
        changeFrequency: 'yearly' as const,
        priority: 0.3,
      },
      // Add all category pages
      ...mockCategories.map((category) => ({
        url: `${baseUrl}/category/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      })),
    ];
  }
}
