import { NextRequest, NextResponse } from 'next/server';

// GET /api/sitemap - Test sitemap generation
export async function GET() {
  try {
    console.log('🔍 Testing sitemap generation...');
    
    // Import sitemap function
    const sitemapModule = await import('@/app/sitemap');
    const sitemap = await sitemapModule.default();
    
    console.log(`📄 Sitemap generated successfully with ${sitemap.length} URLs`);
    
    // Group URLs by type for better overview
    const urlsByType = {
      static: sitemap.filter(url => 
        !url.url.includes('/category/') && 
        !url.url.includes('/article/')
      ),
      categories: sitemap.filter(url => url.url.includes('/category/')),
      articles: sitemap.filter(url => url.url.includes('/article/'))
    };
    
    return NextResponse.json({
      success: true,
      data: {
        totalUrls: sitemap.length,
        breakdown: {
          static: urlsByType.static.length,
          categories: urlsByType.categories.length,
          articles: urlsByType.articles.length
        },
        urls: {
          static: urlsByType.static.map(u => u.url),
          categories: urlsByType.categories.map(u => u.url),
          articles: urlsByType.articles.slice(0, 10).map(u => u.url) // Show first 10 articles
        },
        sampleUrls: sitemap.slice(0, 20) // First 20 URLs with full metadata
      }
    });
    
  } catch (error) {
    console.error('❌ Error testing sitemap:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate sitemap',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
