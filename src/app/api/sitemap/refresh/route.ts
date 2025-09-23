import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

// POST /api/sitemap/refresh - Force refresh sitemap and notify search engines
export async function POST() {
  try {
    console.log('🔄 Force refreshing sitemap...');
    
    // Revalidate sitemap cache
    revalidateTag('sitemap');
    
    // Generate fresh sitemap
    const sitemapModule = await import('@/app/sitemap');
    const sitemap = await sitemapModule.default();
    
    console.log(`📄 Fresh sitemap generated with ${sitemap.length} URLs`);
    
    // Notify search engines
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hotnewstrends.com';
    const sitemapUrl = `${baseUrl}/sitemap.xml`;
    
    const notifications = [];
    
    // Ping Google
    try {
      const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
      const googleResponse = await fetch(googlePingUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'HotNewsTrends-SitemapRefresh/1.0' },
        timeout: 10000
      });
      
      notifications.push({
        service: 'Google',
        success: googleResponse.ok,
        status: googleResponse.status,
        message: googleResponse.ok ? 'Sitemap refresh notification sent' : `HTTP ${googleResponse.status}`
      });
      
      console.log(`📡 Google sitemap refresh: ${googleResponse.ok ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (googleError) {
      notifications.push({
        service: 'Google',
        success: false,
        error: googleError instanceof Error ? googleError.message : 'Unknown error'
      });
    }
    
    // Ping Bing
    try {
      const bingPingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
      const bingResponse = await fetch(bingPingUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'HotNewsTrends-SitemapRefresh/1.0' },
        timeout: 10000
      });
      
      notifications.push({
        service: 'Bing',
        success: bingResponse.ok,
        status: bingResponse.status,
        message: bingResponse.ok ? 'Sitemap refresh notification sent' : `HTTP ${bingResponse.status}`
      });
      
      console.log(`📡 Bing sitemap refresh: ${bingResponse.ok ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (bingError) {
      notifications.push({
        service: 'Bing',
        success: false,
        error: bingError instanceof Error ? bingError.message : 'Unknown error'
      });
    }
    
    const successCount = notifications.filter(n => n.success).length;
    
    return NextResponse.json({
      success: true,
      message: `Sitemap refreshed and ${successCount}/${notifications.length} search engines notified`,
      data: {
        timestamp: new Date().toISOString(),
        sitemapUrl,
        totalUrls: sitemap.length,
        notifications,
        cacheCleared: true
      }
    });
    
  } catch (error) {
    console.error('❌ Error refreshing sitemap:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to refresh sitemap',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/sitemap/refresh - Get refresh status
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Sitemap refresh service is active',
    usage: 'POST to force refresh sitemap and notify search engines',
    endpoints: {
      refresh: 'POST /api/sitemap/refresh',
      ping: 'POST /api/sitemap/ping',
      test: 'GET /api/sitemap'
    }
  });
}
