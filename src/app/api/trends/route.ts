import { NextRequest, NextResponse } from 'next/server';
import { googleTrendsService } from '@/lib/services/google-trends';
import { trendTracker } from '@/lib/services/trend-tracker';
import { automatedArticleGenerator } from '@/lib/services/automated-article-generator';
import { trendsService } from '@/lib/services/trends';

// Cache for trends data
let trendsCache: any = null;
let cacheTimestamp = 0;
// Shorter cache for development, longer for production
const CACHE_DURATION = process.env.NODE_ENV === 'development' ? 5 * 60 * 1000 : 3.5 * 60 * 60 * 1000; // 5 min dev, 3.5h prod

// GET /api/trends - Get trending topics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || 'US';
    const category = searchParams.get('category') || 'all';
    const timeframe = searchParams.get('timeframe') || 'now 1-d';
    const source = searchParams.get('source') || 'google'; // 'google' or 'mock'
    const forceRefresh = searchParams.get('refresh') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log(`🔍 Fetching trends for region: ${region}, category: ${category}, source: ${source}`);

    // Check cache first (longer cache to optimize SerpApi usage)
    const now = Date.now();
    const cacheAge = now - cacheTimestamp;
    const cacheAgeHours = Math.round(cacheAge / (60 * 60 * 1000) * 10) / 10;

    if (trendsCache && cacheAge < CACHE_DURATION && !forceRefresh) {
      console.log(`📦 Returning cached trends data (${cacheAgeHours}h old, expires in ${Math.round((CACHE_DURATION - cacheAge) / (60 * 60 * 1000) * 10) / 10}h)`);
      return NextResponse.json({
        success: true,
        data: {
          ...trendsCache,
          cacheInfo: {
            cached: true,
            ageHours: cacheAgeHours,
            expiresInHours: Math.round((CACHE_DURATION - cacheAge) / (60 * 60 * 1000) * 10) / 10
          }
        }
      });
    }

    let trends;

    if (source === 'google') {
      // Always use Firebase cached data instead of calling SerpAPI
      console.log('📊 Using Firebase cached data (SerpAPI calls disabled)...');
      const { firebaseTrendsService } = await import('@/lib/services/firebase-trends');
      const cachedTrends = await firebaseTrendsService.getLatestTrends(limit);

      trends = {
        topics: cachedTrends,
        lastUpdated: new Date(),
        region,
        timeframe,
        source: 'firebase_cache',
        message: 'Using cached data from scheduled updates'
      };
    } else {
      // Use mock data
      trends = await trendsService.getTrendingTopics(region, category, timeframe);
    }

    // Cache the results
    trendsCache = {
      topics: trends.topics,
      lastUpdated: (trends as any).lastUpdated || new Date().toISOString(),
      region: (trends as any).region || 'US',
      timeframe: (trends as any).timeframe || 'now',
      total: trends.topics.length,
      source: source === 'google' ? 'Google Trends API' : 'Mock Data'
    };
    cacheTimestamp = now;

    return NextResponse.json({
      success: true,
      data: trendsCache
    });

  } catch (error) {
    console.error('❌ Error fetching trends:', error);

    // Fallback to mock data on any error
    try {
      const fallbackTrends = await trendsService.getTrendingTopics('US', 'all', 'now 1-d');
      return NextResponse.json({
        success: true,
        data: {
          ...fallbackTrends,
          source: 'Fallback Mock Data',
          error: 'Primary source failed'
        }
      });
    } catch (fallbackError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch trending topics from all sources'
        },
        { status: 500 }
      );
    }
  }
}

// POST /api/trends - Get topic details
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, region = 'US' } = body;

    if (!keyword) {
      return NextResponse.json(
        { success: false, error: 'Keyword is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Getting topic details for: ${keyword}`);

    const topicDetails = await trendsService.getTopicDetails(keyword, region);

    if (!topicDetails) {
      return NextResponse.json(
        { success: false, error: 'Topic not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: topicDetails
    });

  } catch (error) {
    console.error('Error getting topic details:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get topic details' 
      },
      { status: 500 }
    );
  }
}
