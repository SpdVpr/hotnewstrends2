import { NextRequest, NextResponse } from 'next/server';

// GET /api/seo/audit - Comprehensive SEO audit of all pages
export async function GET() {
  try {
    console.log('🔍 Starting comprehensive SEO audit...');
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    // Get sitemap to know all URLs
    const sitemapModule = await import('@/app/sitemap');
    const sitemap = await sitemapModule.default();
    
    console.log(`📄 Found ${sitemap.length} URLs in sitemap`);
    
    // Test key pages first
    const keyPages = [
      '/',
      '/about',
      '/contact',
      '/privacy',
      '/terms',
      '/category/sports',
      '/category/technology',
      '/category/news',
      '/category/business',
      '/category/entertainment',
      '/category/science',
      '/category/health'
    ];
    
    const auditResults = {
      timestamp: new Date().toISOString(),
      totalPages: sitemap.length,
      testedPages: 0,
      accessiblePages: 0,
      inaccessiblePages: 0,
      seoIssues: [],
      pageResults: [],
      summary: {
        missingTitles: 0,
        missingDescriptions: 0,
        missingCanonicals: 0,
        titleTooShort: 0,
        titleTooLong: 0,
        descriptionTooShort: 0,
        descriptionTooLong: 0
      }
    };
    
    // Test each key page
    for (const page of keyPages) {
      try {
        auditResults.testedPages++;
        const fullUrl = `${baseUrl}${page}`;
        
        console.log(`🔍 Testing: ${fullUrl}`);
        
        const response = await fetch(fullUrl, {
          method: 'HEAD',
          headers: { 'User-Agent': 'SEO-Audit/1.0' },
          timeout: 10000
        });
        
        const pageResult = {
          url: page,
          fullUrl,
          accessible: response.ok,
          statusCode: response.status,
          issues: [],
          seo: null
        };
        
        if (response.ok) {
          auditResults.accessiblePages++;
          
          // Get HTML for SEO analysis
          try {
            const htmlResponse = await fetch(fullUrl, { timeout: 10000 });
            const html = await htmlResponse.text();
            
            // Extract SEO elements
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
            const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
            
            pageResult.seo = {
              title: titleMatch ? titleMatch[1] : null,
              titleLength: titleMatch ? titleMatch[1].length : 0,
              description: descriptionMatch ? descriptionMatch[1] : null,
              descriptionLength: descriptionMatch ? descriptionMatch[1].length : 0,
              canonical: canonicalMatch ? canonicalMatch[1] : null,
            };
            
            // Check for issues
            if (!titleMatch) {
              pageResult.issues.push('Missing title tag');
              auditResults.summary.missingTitles++;
            } else {
              if (titleMatch[1].length < 30) {
                pageResult.issues.push('Title too short (< 30 chars)');
                auditResults.summary.titleTooShort++;
              }
              if (titleMatch[1].length > 60) {
                pageResult.issues.push('Title too long (> 60 chars)');
                auditResults.summary.titleTooLong++;
              }
            }
            
            if (!descriptionMatch) {
              pageResult.issues.push('Missing meta description');
              auditResults.summary.missingDescriptions++;
            } else {
              if (descriptionMatch[1].length < 120) {
                pageResult.issues.push('Description too short (< 120 chars)');
                auditResults.summary.descriptionTooShort++;
              }
              if (descriptionMatch[1].length > 160) {
                pageResult.issues.push('Description too long (> 160 chars)');
                auditResults.summary.descriptionTooLong++;
              }
            }
            
            if (!canonicalMatch) {
              pageResult.issues.push('Missing canonical URL');
              auditResults.summary.missingCanonicals++;
            }
            
          } catch (htmlError) {
            pageResult.issues.push('Could not parse HTML');
          }
          
        } else {
          auditResults.inaccessiblePages++;
          pageResult.issues.push(`HTTP ${response.status}: Page not accessible`);
        }
        
        auditResults.pageResults.push(pageResult);
        auditResults.seoIssues.push(...pageResult.issues.map(issue => ({
          page: page,
          issue: issue
        })));
        
      } catch (error) {
        auditResults.inaccessiblePages++;
        auditResults.pageResults.push({
          url: page,
          fullUrl: `${baseUrl}${page}`,
          accessible: false,
          statusCode: 0,
          issues: [`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`],
          seo: null
        });
      }
    }
    
    // Generate recommendations
    const recommendations = [];
    if (auditResults.summary.missingTitles > 0) {
      recommendations.push(`Fix ${auditResults.summary.missingTitles} pages with missing titles`);
    }
    if (auditResults.summary.missingDescriptions > 0) {
      recommendations.push(`Add meta descriptions to ${auditResults.summary.missingDescriptions} pages`);
    }
    if (auditResults.summary.missingCanonicals > 0) {
      recommendations.push(`Add canonical URLs to ${auditResults.summary.missingCanonicals} pages`);
    }
    if (auditResults.inaccessiblePages > 0) {
      recommendations.push(`Fix ${auditResults.inaccessiblePages} inaccessible pages`);
    }
    
    auditResults.recommendations = recommendations;
    
    console.log(`✅ SEO audit completed: ${auditResults.accessiblePages}/${auditResults.testedPages} pages accessible`);
    
    return NextResponse.json({
      success: true,
      data: auditResults
    });
    
  } catch (error) {
    console.error('❌ Error during SEO audit:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform SEO audit',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
