import { NextRequest, NextResponse } from 'next/server';
import { googleTrendsService } from '@/lib/services/google-trends';

// POST /api/trends/details - Get detailed trend analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, region = 'US', timeframe = 'today 12-m' } = body;

    if (!keyword) {
      return NextResponse.json(
        { success: false, error: 'Keyword is required' },
        { status: 400 }
      );
    }

    console.log(`📊 Getting detailed analysis for: ${keyword}`);

    // Check SerpAPI rate limits before making calls (this endpoint uses 2 calls)
    const { serpApiMonitor } = await import('@/lib/utils/serpapi-monitor');

    if (!serpApiMonitor.canMakeCall()) {
      console.warn('🚫 SerpAPI rate limit reached for trends details');
      return NextResponse.json({
        success: false,
        error: 'SerpAPI rate limit reached. Please try again later.',
        rateLimitInfo: serpApiMonitor.getUsageStats()
      }, { status: 429 });
    }

    // Check if we have enough quota for 2 calls
    const stats = serpApiMonitor.getUsageStats();
    if (stats.today.count >= stats.today.limit - 1) {
      console.warn('🚫 Not enough SerpAPI quota for trends details (needs 2 calls)');
      return NextResponse.json({
        success: false,
        error: 'Not enough SerpAPI quota remaining for detailed analysis (requires 2 calls)',
        rateLimitInfo: stats
      }, { status: 429 });
    }

    console.log(`📊 SerpAPI quota check passed: ${stats.today.count}/${stats.today.limit} used today`);

    // Get multiple data points in parallel
    const [interestOverTime, relatedQueries] = await Promise.allSettled([
      googleTrendsService.getInterestOverTime(keyword, timeframe, region),
      googleTrendsService.getRelatedQueries(keyword, region)
    ]);

    // Log SerpAPI usage for this endpoint (2 calls made)
    let successfulCalls = 0;
    if (interestOverTime.status === 'fulfilled') successfulCalls++;
    if (relatedQueries.status === 'fulfilled') successfulCalls++;

    console.log(`📊 Trends details completed: ${successfulCalls}/2 SerpAPI calls successful for "${keyword}"`);

    const result = {
      keyword,
      region,
      timeframe,
      interestOverTime: interestOverTime.status === 'fulfilled' ? interestOverTime.value : null,
      relatedQueries: relatedQueries.status === 'fulfilled' ? relatedQueries.value : null,
      analysis: {
        trendStrength: 'moderate', // Will be calculated based on data
        peakPeriod: null as string | null,
        averageInterest: 0,
        volatility: 'low',
        recommendation: 'suitable for content creation'
      },
      lastUpdated: new Date().toISOString()
    };

    // Calculate trend analysis if we have interest data
    if (result.interestOverTime?.data && result.interestOverTime.data.length > 0) {
      const values = result.interestOverTime.data
        .map((point: any) => point.value?.[0] || 0)
        .filter((val: number) => val > 0);

      if (values.length > 0) {
        const average = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        
        result.analysis.averageInterest = Math.round(average);
        result.analysis.trendStrength = average > 50 ? 'high' : average > 25 ? 'moderate' : 'low';
        result.analysis.volatility = (max - min) > 30 ? 'high' : (max - min) > 15 ? 'moderate' : 'low';
        
        // Find peak period
        const maxIndex = values.indexOf(max);
        if (maxIndex >= 0 && result.interestOverTime.data[maxIndex]) {
          result.analysis.peakPeriod = (result.interestOverTime.data[maxIndex] as any).formattedTime || 'Recent';
        }
        
        // Generate recommendation
        if (average > 40 && (max - min) < 40) {
          result.analysis.recommendation = 'excellent for content creation - stable high interest';
        } else if (average > 25) {
          result.analysis.recommendation = 'good for content creation - moderate interest';
        } else if (max > 60) {
          result.analysis.recommendation = 'trending topic - create content quickly';
        } else {
          result.analysis.recommendation = 'niche topic - suitable for specialized content';
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Error getting trend details:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get trend details' 
      },
      { status: 500 }
    );
  }
}

// GET /api/trends/details - Get trending keywords for content generation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || 'US';
    const category = searchParams.get('category') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log(`🎯 Getting trending keywords for content generation: ${category} in ${region}`);

    // Get trending topics
    let trends;
    if (category === 'all') {
      trends = await googleTrendsService.getDailyTrends(region);
    } else {
      trends = await googleTrendsService.getTrendsByCategory(category, region);
    }

    // Filter and format for content generation
    const contentKeywords = (trends.topics || [])
      .slice(0, limit)
      .map((topic: any) => ({
        keyword: topic.keyword || 'unknown',
        title: topic.title || 'Unknown Topic',
        category: topic.category || 'general',
        traffic: topic.formattedTraffic || topic.traffic || '1,000+',
        relatedQueries: (topic.relatedQueries || []).slice(0, 5),
        articles: (topic.articles || []).slice(0, 3).map((article: any) => ({
          title: article.title || 'Unknown Article',
          source: article.source || 'Unknown Source',
          snippet: article.snippet || 'No snippet available'
        })),
        contentPotential: {
          score: Math.min(100, Math.max(10, topic.traffic * 0.1 + Math.random() * 20)),
          difficulty: topic.traffic > 100000 ? 'high' : topic.traffic > 50000 ? 'medium' : 'low',
          urgency: topic.timeframe.includes('4-H') ? 'high' : topic.timeframe.includes('1-d') ? 'medium' : 'low',
          recommendation: topic.traffic > 100000 
            ? 'High competition - focus on unique angle' 
            : 'Good opportunity for original content'
        }
      }));

    return NextResponse.json({
      success: true,
      data: {
        keywords: contentKeywords,
        region,
        category,
        total: contentKeywords.length,
        lastUpdated: new Date().toISOString(),
        source: 'Google Trends API'
      }
    });

  } catch (error) {
    console.error('❌ Error getting content keywords:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get content keywords' 
      },
      { status: 500 }
    );
  }
}
