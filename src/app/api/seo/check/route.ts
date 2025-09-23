import { NextRequest, NextResponse } from 'next/server';

// GET /api/seo/check?url=... - Check SEO for a specific page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL parameter is required' },
        { status: 400 }
      );
    }
    
    console.log(`🔍 Checking SEO for URL: ${url}`);
    
    // Test if URL is accessible
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
    
    try {
      const response = await fetch(fullUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'SEO-Checker/1.0'
        }
      });
      
      const seoCheck = {
        url: fullUrl,
        accessible: response.ok,
        statusCode: response.status,
        headers: {
          contentType: response.headers.get('content-type'),
          lastModified: response.headers.get('last-modified'),
          cacheControl: response.headers.get('cache-control'),
        },
        timestamp: new Date().toISOString()
      };
      
      // If accessible, try to get more details
      if (response.ok) {
        try {
          const htmlResponse = await fetch(fullUrl);
          const html = await htmlResponse.text();
          
          // Extract basic SEO elements
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
          const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["'][^>]*>/i);
          const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
          
          seoCheck.seo = {
            title: titleMatch ? titleMatch[1] : null,
            titleLength: titleMatch ? titleMatch[1].length : 0,
            description: descriptionMatch ? descriptionMatch[1] : null,
            descriptionLength: descriptionMatch ? descriptionMatch[1].length : 0,
            keywords: keywordsMatch ? keywordsMatch[1] : null,
            canonical: canonicalMatch ? canonicalMatch[1] : null,
            hasTitle: !!titleMatch,
            hasDescription: !!descriptionMatch,
            hasCanonical: !!canonicalMatch,
          };
          
          // SEO recommendations
          seoCheck.recommendations = [];
          if (!titleMatch) seoCheck.recommendations.push('Missing title tag');
          if (titleMatch && titleMatch[1].length < 30) seoCheck.recommendations.push('Title too short (< 30 chars)');
          if (titleMatch && titleMatch[1].length > 60) seoCheck.recommendations.push('Title too long (> 60 chars)');
          if (!descriptionMatch) seoCheck.recommendations.push('Missing meta description');
          if (descriptionMatch && descriptionMatch[1].length < 120) seoCheck.recommendations.push('Description too short (< 120 chars)');
          if (descriptionMatch && descriptionMatch[1].length > 160) seoCheck.recommendations.push('Description too long (> 160 chars)');
          if (!canonicalMatch) seoCheck.recommendations.push('Missing canonical URL');
          
        } catch (htmlError) {
          console.warn('Could not parse HTML for SEO analysis:', htmlError);
        }
      }
      
      return NextResponse.json({
        success: true,
        data: seoCheck
      });
      
    } catch (fetchError) {
      return NextResponse.json({
        success: false,
        error: 'Could not access URL',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        url: fullUrl
      }, { status: 404 });
    }
    
  } catch (error) {
    console.error('❌ Error checking SEO:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check SEO',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
