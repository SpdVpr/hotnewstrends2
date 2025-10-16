import { NextRequest, NextResponse } from 'next/server';
import { firebaseArticlesService } from '@/lib/services/firebase-articles';

// Helper function to calculate SEO score based on article content
function calculateSEOScore(article: any): number {
  let score = 0;

  // Title length (optimal: 30-60 characters)
  const titleLength = article.title?.length || 0;
  if (titleLength >= 30 && titleLength <= 60) score += 20;
  else if (titleLength >= 20 && titleLength <= 70) score += 15;
  else score += 5;

  // Meta description (optimal: 120-160 characters)
  const descLength = article.seoDescription?.length || 0;
  if (descLength >= 120 && descLength <= 160) score += 20;
  else if (descLength >= 100 && descLength <= 180) score += 15;
  else score += 5;

  // Content length (optimal: 1000+ words)
  const wordCount = article.content ? article.content.split(' ').length : 0;
  if (wordCount >= 1000) score += 20;
  else if (wordCount >= 500) score += 15;
  else score += 5;

  // Tags (optimal: 3-8 tags)
  const tagCount = article.tags?.length || 0;
  if (tagCount >= 3 && tagCount <= 8) score += 20;
  else if (tagCount >= 1 && tagCount <= 10) score += 15;
  else score += 5;

  // Has image
  if (article.image) score += 20;
  else score += 5;

  return Math.min(100, score);
}

// Helper function to calculate performance score
function calculatePerformanceScore(article: any): number {
  let score = 0;

  // Content quality indicators
  const wordCount = article.content ? article.content.split(' ').length : 0;
  const paragraphs = article.content ? article.content.split('\n\n').length : 0;

  // Word count score
  if (wordCount >= 800) score += 25;
  else if (wordCount >= 400) score += 20;
  else score += 10;

  // Structure score (paragraphs)
  if (paragraphs >= 5) score += 25;
  else if (paragraphs >= 3) score += 20;
  else score += 10;

  // Readability (simple heuristic based on sentence length)
  const sentences = article.content ? article.content.split(/[.!?]+/).length : 0;
  const avgWordsPerSentence = sentences > 0 ? wordCount / sentences : 0;
  if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 25) score += 25;
  else if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 30) score += 20;
  else score += 10;

  // Engagement potential (has trending topics)
  if (article.trending) score += 25;
  else score += 15;

  return Math.min(100, score);
}

// Helper function to calculate engagement rate
function calculateEngagement(article: any): number {
  const views = article.views || 0;
  const likes = article.likes || 0;
  const shares = article.shares || 0;
  const comments = article.comments || 0;

  if (views === 0) return 0;

  // Engagement rate = (likes + shares + comments) / views * 100
  const engagementRate = ((likes + shares + comments) / views) * 100;
  return Math.round(Math.min(100, engagementRate));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const tag = searchParams.get('tag') || undefined;

    // Get articles from Firebase
    const articles = await firebaseArticlesService.getArticles({
      limit,
      offset: (page - 1) * limit,
      category,
      status,
      search,
      tag
    });

    // Get total count for pagination
    const total = await firebaseArticlesService.getArticlesCount({
      category,
      status,
      search,
      tag
    });

    const totalPages = Math.ceil(total / limit);

    // Debug: Log category information for first few articles
    if (articles.length > 0) {
      console.log('🔍 DEBUG: Article categories analysis:');
      const categoryStats: Record<string, number> = {};

      articles.slice(0, 5).forEach((article, index) => {
        console.log(`${index + 1}. ${article.title?.substring(0, 40)}...`);
        console.log(`   Category: ${JSON.stringify(article.category)}`);
        console.log(`   Type: ${typeof article.category}`);

        const categoryKey = typeof article.category === 'string' ? article.category :
                           article.category?.name || article.category?.slug || article.category?.id || 'unknown';
        categoryStats[categoryKey] = (categoryStats[categoryKey] || 0) + 1;
      });

      console.log('📊 Available categories:', Object.keys(categoryStats));
    }

    // Add real analytics and metadata
    const enrichedArticles = articles.map(article => {
      const wordCount = article.content ? article.content.split(' ').length : 0;
      const readingTime = Math.ceil(wordCount / 200);

      // Calculate SEO score based on real factors
      const seoScore = calculateSEOScore(article);

      // Calculate performance score based on content quality
      const performanceScore = calculatePerformanceScore(article);

      // Ensure dates are properly serialized as ISO strings
      const publishedAt = article.publishedAt instanceof Date
        ? article.publishedAt.toISOString()
        : article.publishedAt;

      const createdAt = article.createdAt instanceof Date
        ? article.createdAt.toISOString()
        : article.createdAt;

      const updatedAt = article.updatedAt instanceof Date
        ? article.updatedAt.toISOString()
        : article.updatedAt;

      return {
        ...article,
        publishedAt,
        createdAt,
        updatedAt,
        metadata: {
          readingTime,
          wordCount,
          seoScore,
          performanceScore
        },
        analytics: {
          views: article.views || 0,
          shares: article.shares || 0,
          engagement: calculateEngagement(article)
        },
        source: {
          topic: article.metadata?.originalTopic || article.title,
          generatedBy: article.metadata?.generatedBy || 'Perplexity AI',
          confidence: article.confidence || 85
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        articles: enrichedArticles,
        total,
        page,
        limit,
        totalPages
      }
    });

  } catch (error) {
    console.error('❌ Error fetching articles:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch articles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { title, content, excerpt, category, tags, status = 'draft' } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const article = await firebaseArticlesService.createArticle({
      title,
      slug,
      content,
      excerpt: excerpt || content.substring(0, 200) + '...',
      author: 'TrendyBlogger',
      category: typeof category === 'string'
        ? { id: category, name: category, slug: category.toLowerCase() }
        : category || { id: 'technology', name: 'Technology', slug: 'technology' },
      tags: tags || [],
      seoTitle: title,
      seoDescription: excerpt || content.substring(0, 160) + '...',
      seoKeywords: tags || [],
      readTime: `${Math.ceil((content?.split(' ').length || 0) / 200)} min read`,
      status,
      publishedAt: new Date(),
      featured: false,
      trending: false,
      sources: [],
      confidence: 0.8,
      metadata: {
        originalTopic: title,
        generatedBy: 'Manual',
        confidence: 100
      }
    });

    // Notify search engines about new article if published
    if (status === 'published') {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hotnewstrends.com';
        const pingResponse = await fetch(`${baseUrl}/api/sitemap/ping`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            articleSlug: slug,
            action: 'new'
          })
        });

        if (pingResponse.ok) {
          console.log(`🔔 Search engines notified about new article: ${slug}`);
        } else {
          console.warn(`⚠️ Failed to notify search engines: ${pingResponse.status}`);
        }
      } catch (pingError) {
        console.warn('⚠️ Could not ping search engines:', pingError);
      }
    }

    return NextResponse.json({
      success: true,
      data: article
    });

  } catch (error) {
    console.error('❌ Error creating article:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create article',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
