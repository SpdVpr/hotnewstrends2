import { NextRequest, NextResponse } from 'next/server';

// GET /api/cron/trends-import - Cron job for importing trends (3x daily)
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (optional security)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('🚫 Unauthorized cron request');
      // Don't return error for missing CRON_SECRET in development
      if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('🕐 Trends import cron job started');
    
    // Get current Prague time
    const now = new Date();
    const pragueTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Prague" }));
    const currentHour = pragueTime.getHours();
    const currentMinute = pragueTime.getMinutes();
    
    console.log(`🕐 Current Prague time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
    
    // Check if we're in active hours (6:00-22:00)
    if (currentHour < 6 || currentHour >= 22) {
      console.log(`⏰ Outside active hours (6:00-22:00), skipping import`);
      return NextResponse.json({
        success: true,
        action: 'skipped',
        reason: 'outside_active_hours',
        currentHour,
        activeHours: '6:00-22:00',
        timestamp: new Date().toISOString()
      });
    }
    
    // Import services
    const { googleTrendsService } = await import('@/lib/services/google-trends');
    const { firebaseTrendsService } = await import('@/lib/services/firebase-trends');
    const { serpApiMonitor } = await import('@/lib/utils/serpapi-monitor');
    
    // Check SerpAPI quota
    const stats = serpApiMonitor.getUsageStats();
    console.log(`📊 SerpAPI usage: ${stats.today.count}/${stats.today.limit} today, ${stats.monthly.count}/${stats.monthly.limit} monthly`);
    
    if (!serpApiMonitor.canMakeCall()) {
      console.log('🚫 SerpAPI rate limit reached, skipping import');
      return NextResponse.json({
        success: false,
        action: 'skipped',
        reason: 'rate_limit_reached',
        usage: stats,
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if we already imported recently (prevent duplicate imports)
    const lastImportKey = `trends_import_${new Date().toISOString().split('T')[0]}`;
    // Note: In production, you might want to use Redis or database to track this
    
    try {
      // Fetch latest trends from SerpAPI
      console.log('📡 Fetching trends from SerpAPI...');
      const trendsData = await googleTrendsService.getDailyTrends('US');
      
      if (!trendsData.topics || trendsData.topics.length === 0) {
        console.log('⚠️ No trends data received from SerpAPI');
        return NextResponse.json({
          success: false,
          action: 'failed',
          reason: 'no_data_received',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`✅ Received ${trendsData.topics.length} trends from SerpAPI`);
      
      // Save trends to Firebase
      console.log('💾 Saving trends to Firebase...');
      const batchId = await firebaseTrendsService.saveTrendsBatch(trendsData.topics);
      
      console.log(`✅ Trends saved to Firebase with batch ID: ${batchId}`);

      // Refresh daily plan with new trends
      try {
        console.log('🔄 Refreshing daily plan after trends import...');
        const { automatedArticleGenerator } = await import('@/lib/services/automated-article-generator');
        await automatedArticleGenerator.refreshDailyPlan();
        console.log('✅ Daily plan refreshed after trends import');
      } catch (refreshError) {
        console.error('❌ Failed to refresh daily plan after trends import:', refreshError);
        // Don't fail the whole import if refresh fails
      }

      // Get updated usage stats
      const updatedStats = serpApiMonitor.getUsageStats();

      return NextResponse.json({
        success: true,
        action: 'imported',
        batchId: batchId,
        trendsCount: trendsData.topics.length,
        serpApiUsage: updatedStats,
        timestamp: new Date().toISOString(),
        pragueTime: pragueTime.toISOString(),
        currentHour,
        sampleTrends: trendsData.topics.slice(0, 3).map((trend: any) => ({
          title: trend.title,
          traffic: trend.traffic,
          category: trend.category
        }))
      });
      
    } catch (importError) {
      console.error('❌ Error during trends import:', importError);
      return NextResponse.json({
        success: false,
        action: 'failed',
        error: importError instanceof Error ? importError.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error in trends import cron:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
