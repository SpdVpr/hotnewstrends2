import { NextRequest, NextResponse } from 'next/server';

// POST /api/seo/ping-search-engines - Ping search engines about sitemap updates
export async function POST(request: NextRequest) {
  try {
    console.log('📡 Pinging search engines about sitemap updates...');
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hotnewstrends.com';
    const sitemapUrl = `${baseUrl}/sitemap.xml`;
    
    const results = [];
    
    // Ping Google
    try {
      const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
      const googleResponse = await fetch(googlePingUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'HotNewsTrends-Bot/1.0'
        }
      });
      
      results.push({
        engine: 'Google',
        status: googleResponse.ok ? 'success' : 'failed',
        statusCode: googleResponse.status,
        message: googleResponse.ok ? 'Sitemap ping successful' : 'Sitemap ping failed'
      });
      
      console.log(`✅ Google ping: ${googleResponse.status}`);
    } catch (error) {
      results.push({
        engine: 'Google',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('❌ Google ping failed:', error);
    }
    
    // Ping Bing
    try {
      const bingPingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
      const bingResponse = await fetch(bingPingUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'HotNewsTrends-Bot/1.0'
        }
      });
      
      results.push({
        engine: 'Bing',
        status: bingResponse.ok ? 'success' : 'failed',
        statusCode: bingResponse.status,
        message: bingResponse.ok ? 'Sitemap ping successful' : 'Sitemap ping failed'
      });
      
      console.log(`✅ Bing ping: ${bingResponse.status}`);
    } catch (error) {
      results.push({
        engine: 'Bing',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('❌ Bing ping failed:', error);
    }
    
    const successCount = results.filter(r => r.status === 'success').length;
    
    return NextResponse.json({
      success: successCount > 0,
      message: `Pinged ${results.length} search engines, ${successCount} successful`,
      data: {
        sitemapUrl,
        results,
        timestamp: new Date().toISOString(),
        nextSteps: [
          'Check Google Search Console for crawl activity in 24-48 hours',
          'Monitor indexing progress in Search Console → Coverage report',
          'Submit individual URLs manually for faster indexing'
        ]
      }
    });
    
  } catch (error) {
    console.error('❌ Error pinging search engines:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

