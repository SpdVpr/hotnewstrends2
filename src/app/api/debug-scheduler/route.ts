import { NextRequest, NextResponse } from 'next/server';

// GET /api/debug-scheduler - Debug trends scheduler status
export async function GET(request: NextRequest) {
  try {
    // Import scheduler to check its status
    const { trendsScheduler } = await import('@/lib/services/trends-scheduler');
    const stats = trendsScheduler.getStats();
    
    // Also check Firebase trends directly
    const { firebaseTrendsService } = await import('@/lib/services/firebase-trends');
    const latestTrends = await firebaseTrendsService.getLatestTrends(10);
    
    // Check Google Trends service
    const { googleTrendsService } = await import('@/lib/services/google-trends');
    
    return NextResponse.json({
      success: true,
      scheduler: {
        isRunning: stats.isRunning,
        lastUpdate: stats.lastUpdate,
        nextUpdate: stats.nextUpdate,
        totalUpdates: stats.totalUpdates,
        trendsCollected: stats.trendsCollected,
        updatesPerDay: stats.updatesPerDay
      },
      firebase: {
        latestTrendsCount: latestTrends.length,
        firstTrend: latestTrends[0] || null,
        trends: latestTrends.slice(0, 5).map(trend => ({
          title: trend.title,
          source: trend.source,
          searchVolume: trend.searchVolume,
          createdAt: trend.createdAt
        }))
      },
      environment: {
        hasSerpApiKey: !!process.env.SERPAPI_KEY,
        nodeEnv: process.env.NODE_ENV,
        vercelUrl: process.env.VERCEL_URL
      },
      currentTime: new Date().toISOString(),
      currentHour: new Date().getHours()
    });

  } catch (error) {
    console.error('❌ Debug scheduler error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
