import { NextRequest, NextResponse } from 'next/server';

// GET /api/check-trends-status - Check when trends were last updated
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking trends update status...');
    
    // Import Firebase trends service
    const { firebaseTrendsService } = await import('@/lib/services/firebase-trends');
    
    // Get latest trends from Firebase
    console.log('📊 Fetching latest trends from Firebase...');
    const allTrends = await firebaseTrendsService.getLatestTrends(50);
    
    console.log(`📊 Found ${allTrends.length} trends in Firebase`);
    
    // Analyze trends by source and time
    const serpApiTrends = allTrends.filter(trend => trend.source === 'SerpAPI');
    const rssTrends = allTrends.filter(trend => trend.source === 'RSS');
    
    // Find newest and oldest trends
    const sortedByTime = allTrends.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    const newestTrend = sortedByTime[0];
    const oldestTrend = sortedByTime[sortedByTime.length - 1];
    
    // Calculate time since last update
    const now = new Date();
    const lastUpdateTime = newestTrend ? new Date(newestTrend.createdAt) : null;
    const timeSinceLastUpdate = lastUpdateTime ? 
      Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60)) : null;
    
    // Check SerpAPI usage
    let serpApiStatus = null;
    try {
      const serpApiResponse = await fetch('https://www.hotnewstrends.com/api/test-serpapi');
      const serpApiData = await serpApiResponse.json();
      serpApiStatus = {
        success: serpApiData.success,
        hasKey: serpApiData.hasKey,
        responseStatus: serpApiData.responseStatus,
        trendingSearchesCount: serpApiData.trendingSearchesCount,
        firstTrend: serpApiData.firstTrend
      };
    } catch (error) {
      serpApiStatus = { error: 'Failed to check SerpAPI status' };
    }
    
    // Sample of latest trends
    const latestTrendsDetails = sortedByTime.slice(0, 10).map(trend => ({
      title: trend.title,
      source: trend.source,
      searchVolume: trend.searchVolume,
      createdAt: trend.createdAt,
      timeAgo: Math.floor((now.getTime() - new Date(trend.createdAt).getTime()) / (1000 * 60))
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        totalTrends: allTrends.length,
        breakdown: {
          serpApi: serpApiTrends.length,
          rss: rssTrends.length
        },
        lastUpdate: {
          newestTrend: newestTrend ? {
            title: newestTrend.title,
            source: newestTrend.source,
            createdAt: newestTrend.createdAt,
            minutesAgo: timeSinceLastUpdate
          } : null,
          oldestTrend: oldestTrend ? {
            title: oldestTrend.title,
            source: oldestTrend.source,
            createdAt: oldestTrend.createdAt
          } : null,
          timeSinceLastUpdateMinutes: timeSinceLastUpdate
        },
        serpApiStatus,
        latestTrends: latestTrendsDetails,
        recommendations: {
          needsUpdate: timeSinceLastUpdate ? timeSinceLastUpdate > 60 : true,
          schedulerIssue: timeSinceLastUpdate ? timeSinceLastUpdate > 240 : true, // 4 hours
          message: timeSinceLastUpdate ? 
            timeSinceLastUpdate > 240 ? 'Scheduler appears to be broken - no updates for 4+ hours' :
            timeSinceLastUpdate > 60 ? 'Trends are stale - should update every hour' :
            'Trends are relatively fresh' :
            'No trends found in Firebase'
        }
      }
    });

  } catch (error) {
    console.error('❌ Error checking trends status:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
