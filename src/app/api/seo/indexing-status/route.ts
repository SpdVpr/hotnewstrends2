import { NextRequest, NextResponse } from 'next/server';

// GET /api/seo/indexing-status - Check SEO and indexing status
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking SEO and indexing status...');
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hotnewstrends.com';
    
    // Check sitemap
    let sitemapStatus = { exists: false, urlCount: 0, error: null };
    try {
      const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`);
      if (sitemapResponse.ok) {
        const sitemapText = await sitemapResponse.text();
        const urlMatches = sitemapText.match(/<loc>/g);
        sitemapStatus = {
          exists: true,
          urlCount: urlMatches ? urlMatches.length : 0,
          error: null
        };
      }
    } catch (error) {
      sitemapStatus.error = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Check robots.txt
    let robotsStatus = { exists: false, allowsCrawling: false, hasSitemap: false, error: null };
    try {
      const robotsResponse = await fetch(`${baseUrl}/robots.txt`);
      if (robotsResponse.ok) {
        const robotsText = await robotsResponse.text();
        robotsStatus = {
          exists: true,
          allowsCrawling: robotsText.includes('Allow: /') || !robotsText.includes('Disallow: /'),
          hasSitemap: robotsText.includes('Sitemap:'),
          error: null
        };
      }
    } catch (error) {
      robotsStatus.error = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Get articles count from API
    let articlesCount = 0;
    try {
      const articlesResponse = await fetch(`${baseUrl}/api/articles?limit=1000`);
      if (articlesResponse.ok) {
        const articlesData = await articlesResponse.json();
        articlesCount = articlesData.data?.articles?.length || 0;
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
    
    // SEO recommendations
    const recommendations = [];
    
    if (!sitemapStatus.exists) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Sitemap not accessible',
        solution: 'Ensure sitemap.xml is publicly accessible'
      });
    } else if (sitemapStatus.urlCount < articlesCount) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: `Sitemap has ${sitemapStatus.urlCount} URLs but ${articlesCount} articles exist`,
        solution: 'Regenerate sitemap to include all articles'
      });
    }
    
    if (!robotsStatus.exists) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Robots.txt not accessible',
        solution: 'Create robots.txt file'
      });
    } else if (!robotsStatus.allowsCrawling) {
      recommendations.push({
        priority: 'CRITICAL',
        issue: 'Robots.txt blocks crawling',
        solution: 'Update robots.txt to allow crawling'
      });
    } else if (!robotsStatus.hasSitemap) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: 'Robots.txt missing sitemap reference',
        solution: 'Add Sitemap: directive to robots.txt'
      });
    }
    
    // Indexing tips
    const indexingTips = [
      {
        title: 'Manual URL Submission',
        description: 'Submit your most important URLs manually in Google Search Console',
        action: 'Go to Search Console → URL Inspection → Request Indexing',
        priority: 1
      },
      {
        title: 'Internal Linking',
        description: 'Ensure all articles are linked from homepage or category pages',
        action: 'Add "Related Articles" sections to each article',
        priority: 2
      },
      {
        title: 'Social Signals',
        description: 'Share new articles on social media to help Google discover them',
        action: 'Post on Twitter, Facebook, LinkedIn when publishing',
        priority: 3
      },
      {
        title: 'Backlinks',
        description: 'Get links from other websites to improve crawl rate',
        action: 'Submit to web directories, reach out to related sites',
        priority: 4
      },
      {
        title: 'Ping Google',
        description: 'Notify Google when sitemap is updated',
        action: `Visit: https://www.google.com/ping?sitemap=${baseUrl}/sitemap.xml`,
        priority: 5
      }
    ];
    
    // Expected indexing timeline
    const timeline = [
      { period: 'First 2 weeks', expected: '2-10 pages', status: 'current' },
      { period: '1 month', expected: '20-50 pages', status: 'upcoming' },
      { period: '2-3 months', expected: '100-200 pages', status: 'upcoming' },
      { period: '3-6 months', expected: 'Most pages', status: 'upcoming' }
    ];
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          sitemapUrls: sitemapStatus.urlCount,
          articlesCount,
          sitemapHealthy: sitemapStatus.exists && sitemapStatus.urlCount > 0,
          robotsHealthy: robotsStatus.exists && robotsStatus.allowsCrawling,
          readyForIndexing: sitemapStatus.exists && robotsStatus.exists && robotsStatus.allowsCrawling
        },
        sitemap: sitemapStatus,
        robots: robotsStatus,
        recommendations,
        indexingTips,
        timeline,
        actions: {
          pingGoogle: `https://www.google.com/ping?sitemap=${baseUrl}/sitemap.xml`,
          searchConsole: 'https://search.google.com/search-console',
          bingWebmaster: 'https://www.bing.com/webmasters'
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking indexing status:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

