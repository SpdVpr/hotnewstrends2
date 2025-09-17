import { MetadataRoute } from 'next';
import { cache, cacheKeys, revalidationTimes } from '@/lib/cache';
import { automationService } from '@/lib/services/automation';

// Get articles from automation service
async function getArticles() {
  try {
    const articles = automationService.getCompletedArticles();
    return articles.map(article => ({
      slug: article.slug,
      publishedAt: article.publishedAt,
      updatedAt: article.updatedAt || article.publishedAt,
      category: article.category.slug
    }));
  } catch (error) {
    console.error('Error fetching articles for sitemap:', error);
    return [];
  }
}

// Mock categories - in production, fetch from database
const mockCategories = [
  { slug: 'technology' },
  { slug: 'news' },
  { slug: 'business' },
  { slug: 'science' },
  { slug: 'health' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Use cache to avoid regenerating sitemap too frequently
  return cache.getOrSet(
    cacheKeys.sitemap(),
    async () => {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hotnewstrends.com';

      // Get articles from automation service
      const articles = await getArticles();

      // Static pages with dynamic priorities based on importance
      const staticPages = [
        {
          url: baseUrl,
          lastModified: new Date(),
          changeFrequency: 'hourly' as const,
          priority: 1.0,
        },
        {
          url: `${baseUrl}/search`,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.8,
        },
        {
          url: `${baseUrl}/admin`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.3,
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
    },
    {
      ttl: revalidationTimes.sitemap,
      tags: ['sitemap', 'articles']
    }
  );
}
