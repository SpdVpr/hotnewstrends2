import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging Daily Plan vs Google Trends sync...');
    
    // Get latest trends from Firebase
    const { firebaseTrendsService } = await import('@/lib/services/firebase-trends');
    const latestTrends = await firebaseTrendsService.getLatestTrends(10);
    
    // Get current daily plan
    const { automatedArticleGenerator } = await import('@/lib/services/automated-article-generator');
    const stats = await automatedArticleGenerator.getStats();
    
    console.log(`📊 Firebase trends: ${latestTrends.length} trends`);
    console.log(`📅 Daily plan: ${stats.dailyPlan?.jobs.length || 0} jobs`);
    
    // Compare first few trends
    const comparison = {
      firebaseTrends: latestTrends.slice(0, 5).map(trend => ({
        title: trend.title,
        searchVolume: trend.searchVolume,
        source: trend.source,
        createdAt: trend.createdAt
      })),
      dailyPlanJobs: stats.dailyPlan?.jobs.slice(0, 5).map(job => ({
        position: job.position,
        title: job.trend.title,
        searchVolume: job.trend.searchVolume,
        source: job.trend.source,
        status: job.status,
        scheduledAt: job.scheduledAt
      })) || []
    };
    
    // Check if trends match
    const trendsMatch = latestTrends.length > 0 && stats.dailyPlan?.jobs.length > 0 &&
      latestTrends[0].title === stats.dailyPlan.jobs[0].trend.title;
    
    // Get last update times
    const lastTrendUpdate = latestTrends.length > 0 ? new Date(latestTrends[0].createdAt) : null;
    const lastPlanUpdate = stats.dailyPlan ? new Date(stats.dailyPlan.updatedAt) : null;
    
    const syncStatus = {
      trendsMatch,
      lastTrendUpdate: lastTrendUpdate?.toISOString(),
      lastPlanUpdate: lastPlanUpdate?.toISOString(),
      timeDifference: lastTrendUpdate && lastPlanUpdate ? 
        Math.abs(lastTrendUpdate.getTime() - lastPlanUpdate.getTime()) / 1000 : null,
      needsSync: !trendsMatch || (lastTrendUpdate && lastPlanUpdate && lastTrendUpdate > lastPlanUpdate)
    };
    
    console.log('🔍 Sync status:', syncStatus);
    
    return NextResponse.json({
      success: true,
      data: {
        syncStatus,
        comparison,
        firebaseTrendsCount: latestTrends.length,
        dailyPlanJobsCount: stats.dailyPlan?.jobs.length || 0,
        recommendations: syncStatus.needsSync ? [
          'Daily Plan is out of sync with Firebase trends',
          'Call POST /api/daily-plan with action=refresh to sync',
          'Or wait for next automatic trends update'
        ] : [
          'Daily Plan is in sync with Firebase trends'
        ]
      }
    });
    
  } catch (error) {
    console.error('❌ Debug sync failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'force-sync') {
      console.log('🔄 Force syncing Daily Plan with Firebase trends...');
      
      const { automatedArticleGenerator } = await import('@/lib/services/automated-article-generator');
      
      // Get stats before
      const statsBefore = await automatedArticleGenerator.getStats();
      
      // Force refresh
      await automatedArticleGenerator.refreshDailyPlan();
      
      // Get stats after
      const statsAfter = await automatedArticleGenerator.getStats();
      
      return NextResponse.json({
        success: true,
        message: 'Daily Plan force synced with Firebase trends',
        data: {
          before: {
            totalJobs: statsBefore.totalJobs,
            firstJob: statsBefore.dailyPlan?.jobs[0]?.trend.title
          },
          after: {
            totalJobs: statsAfter.totalJobs,
            firstJob: statsAfter.dailyPlan?.jobs[0]?.trend.title
          }
        }
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use force-sync.'
    }, { status: 400 });
    
  } catch (error) {
    console.error('❌ Force sync failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
