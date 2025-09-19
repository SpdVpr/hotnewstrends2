import { NextRequest, NextResponse } from 'next/server';

// GET /api/manual-trends-update - Manual trends update (works with GET for easy testing)
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Manual trends update initiated via GET...');
    
    // Check if we have required config
    const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const hasSerpApiKey = !!process.env.SERPAPI_KEY;

    console.log(`🔑 Service Account: ${hasServiceAccount ? 'SET' : 'NOT_SET'}`);
    console.log(`🔑 SerpAPI Key: ${hasSerpApiKey ? 'SET' : 'NOT_SET'}`);

    // Try to proceed without service account (using client-side Firebase)
    if (!hasServiceAccount) {
      console.log('⚠️ No service account - trying client-side Firebase...');
    }
    
    if (!hasSerpApiKey) {
      return NextResponse.json({
        success: false,
        error: 'SERPAPI_KEY environment variable not set',
        details: 'Cannot fetch trends without SerpAPI key'
      }, { status: 500 });
    }
    
    // Manual trends update disabled to conserve SerpAPI quota
    console.log('🚫 Manual trends update disabled to conserve SerpAPI quota');

    return NextResponse.json({
      success: false,
      error: 'Manual trends update is disabled to conserve SerpAPI quota. Only scheduled updates are allowed.',
      message: 'Use the automatic scheduler which updates 6 times per day'
    }, { status: 403 });
    
    console.log(`📊 Received ${trendsData.topics.length} trends from ${trendsData.source}`);
    
    // Count SerpAPI vs RSS
    const serpApiCount = trendsData.topics.filter(t => t.source === 'SerpAPI').length;
    const rssCount = trendsData.topics.filter(t => t.source === 'RSS').length;
    
    console.log(`📈 Breakdown: ${serpApiCount} SerpAPI + ${rssCount} RSS = ${trendsData.topics.length} total`);
    
    // Save trends to Firebase using batch method
    console.log('💾 Saving trends to Firebase using batch method...');
    let successCount = 0;
    let errorCount = 0;
    let saveResults = [];

    try {
      // Use saveTrendsBatch method instead of individual saves
      const batchId = await firebaseTrendsService.saveTrendsBatch(trendsData.topics);
      console.log(`✅ Successfully saved batch with ID: ${batchId}`);

      successCount = trendsData.topics.length;
      saveResults = trendsData.topics.slice(0, 10).map(trend => ({
        title: trend.title,
        status: 'success',
        batchId: batchId
      }));

    } catch (error) {
      console.error('❌ Failed to save trends batch:', error);
      errorCount = trendsData.topics.length;
      saveResults = [{
        title: 'Batch Save',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }];
    }
    
    console.log(`✅ Trends update completed: ${successCount} saved, ${errorCount} failed`);

    // Auto-refresh Daily Plan after trends update
    let dailyPlanRefresh = null;
    if (successCount > 0) {
      try {
        console.log('🔄 Auto-refreshing Daily Plan with new trends...');
        console.log(`📊 Trends updated: ${successCount} new trends saved to Firebase`);

        const { automatedArticleGenerator } = await import('@/lib/services/automated-article-generator');

        // Get stats before refresh
        const statsBefore = await automatedArticleGenerator.getStats();
        console.log('📊 Daily Plan BEFORE refresh:', {
          totalJobs: statsBefore.totalJobs,
          pendingJobs: statsBefore.pendingJobs,
          completedJobs: statsBefore.completedJobs
        });

        console.log('🔄 Calling refreshDailyPlan()...');
        await automatedArticleGenerator.refreshDailyPlan();
        console.log('✅ refreshDailyPlan() completed');

        // Get stats after refresh
        const statsAfter = await automatedArticleGenerator.getStats();
        console.log('📊 Daily Plan AFTER refresh:', {
          totalJobs: statsAfter.totalJobs,
          pendingJobs: statsAfter.pendingJobs,
          completedJobs: statsAfter.completedJobs
        });

        dailyPlanRefresh = {
          status: 'success',
          message: 'Daily Plan automatically refreshed with new trends',
          before: {
            totalJobs: statsBefore.totalJobs,
            pendingJobs: statsBefore.pendingJobs
          },
          after: {
            totalJobs: statsAfter.totalJobs,
            pendingJobs: statsAfter.pendingJobs
          }
        };
        console.log('✅ Daily Plan auto-refresh completed successfully');
      } catch (error) {
        console.error('❌ Failed to auto-refresh Daily Plan:', error);
        console.error('❌ Error details:', error instanceof Error ? error.stack : error);
        dailyPlanRefresh = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          details: error instanceof Error ? error.stack : undefined
        };
      }
    } else {
      console.log('⚠️ No trends updated, skipping Daily Plan refresh');
    }

    // Get updated stats
    let updatedStats = null;
    try {
      const latestTrends = await firebaseTrendsService.getLatestTrends(10);
      updatedStats = {
        totalTrends: latestTrends.length,
        latestTrend: latestTrends[0] ? {
          title: latestTrends[0].title,
          source: latestTrends[0].source,
          createdAt: latestTrends[0].createdAt
        } : null
      };
    } catch (error) {
      console.warn('⚠️ Could not get updated stats:', error);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalProcessed: trendsData.topics.length,
          successCount,
          errorCount,
          serpApiCount,
          rssCount
        },
        saveResults: saveResults.slice(0, 10), // First 10 results
        dailyPlanRefresh,
        updatedStats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error in manual trends update:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// POST method for compatibility
export async function POST(request: NextRequest) {
  return GET(request);
}
