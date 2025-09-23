import { NextRequest, NextResponse } from 'next/server';

// POST /api/sitemap/ping - Notify search engines about sitemap updates
export async function POST(request: NextRequest) {
  try {
    const { articleSlug, action = 'new' } = await request.json();
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hotnewstrends.com';
    const sitemapUrl = `${baseUrl}/sitemap.xml`;
    
    console.log(`🔔 Pinging search engines about ${action} article: ${articleSlug}`);
    
    const results = {
      timestamp: new Date().toISOString(),
      sitemapUrl,
      articleSlug,
      action,
      notifications: []
    };
    
    // Ping Google
    try {
      const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
      const googleResponse = await fetch(googlePingUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'HotNewsTrends-SitemapPing/1.0'
        },
        timeout: 10000
      });
      
      results.notifications.push({
        service: 'Google',
        url: googlePingUrl,
        success: googleResponse.ok,
        status: googleResponse.status,
        message: googleResponse.ok ? 'Sitemap ping successful' : `HTTP ${googleResponse.status}`
      });
      
      console.log(`📡 Google ping: ${googleResponse.ok ? 'SUCCESS' : 'FAILED'} (${googleResponse.status})`);
      
    } catch (googleError) {
      results.notifications.push({
        service: 'Google',
        success: false,
        error: googleError instanceof Error ? googleError.message : 'Unknown error'
      });
      console.error('❌ Google ping failed:', googleError);
    }
    
    // Ping Bing
    try {
      const bingPingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
      const bingResponse = await fetch(bingPingUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'HotNewsTrends-SitemapPing/1.0'
        },
        timeout: 10000
      });
      
      results.notifications.push({
        service: 'Bing',
        url: bingPingUrl,
        success: bingResponse.ok,
        status: bingResponse.status,
        message: bingResponse.ok ? 'Sitemap ping successful' : `HTTP ${bingResponse.status}`
      });
      
      console.log(`📡 Bing ping: ${bingResponse.ok ? 'SUCCESS' : 'FAILED'} (${bingResponse.status})`);
      
    } catch (bingError) {
      results.notifications.push({
        service: 'Bing',
        success: false,
        error: bingError instanceof Error ? bingError.message : 'Unknown error'
      });
      console.error('❌ Bing ping failed:', bingError);
    }
    
    // Also try to ping the specific article URL for faster indexing
    if (articleSlug && action === 'new') {
      try {
        const articleUrl = `${baseUrl}/article/${articleSlug}`;
        
        // Google IndexNow API (if we have API key)
        const indexNowKey = process.env.GOOGLE_INDEXNOW_KEY;
        if (indexNowKey) {
          const indexNowResponse = await fetch('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              host: new URL(baseUrl).hostname,
              key: indexNowKey,
              urlList: [articleUrl]
            }),
            timeout: 10000
          });
          
          results.notifications.push({
            service: 'IndexNow',
            success: indexNowResponse.ok,
            status: indexNowResponse.status,
            message: indexNowResponse.ok ? 'Article submitted for indexing' : `HTTP ${indexNowResponse.status}`,
            articleUrl
          });
          
          console.log(`🚀 IndexNow: ${indexNowResponse.ok ? 'SUCCESS' : 'FAILED'} for ${articleUrl}`);
        }
        
      } catch (indexError) {
        console.error('❌ IndexNow failed:', indexError);
      }
    }
    
    const successCount = results.notifications.filter(n => n.success).length;
    const totalCount = results.notifications.length;
    
    console.log(`✅ Search engine notifications: ${successCount}/${totalCount} successful`);
    
    return NextResponse.json({
      success: true,
      message: `Notified ${successCount}/${totalCount} search engines about sitemap update`,
      data: results
    });
    
  } catch (error) {
    console.error('❌ Error pinging search engines:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to ping search engines',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/sitemap/ping - Get ping status/history
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Sitemap ping service is active',
    endpoints: {
      google: 'https://www.google.com/ping?sitemap=...',
      bing: 'https://www.bing.com/ping?sitemap=...',
      indexnow: 'https://api.indexnow.org/indexnow'
    },
    usage: 'POST with { "articleSlug": "article-slug", "action": "new|update|delete" }'
  });
}
