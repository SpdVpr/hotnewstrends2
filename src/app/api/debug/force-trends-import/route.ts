import { NextRequest, NextResponse } from 'next/server';

// POST /api/debug/force-trends-import - Force trends import for testing
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Force trends import initiated...');
    
    // Import services
    const { googleTrendsService } = await import('@/lib/services/google-trends');
    const { firebaseTrendsService } = await import('@/lib/services/firebase-trends');
    const { serpApiMonitor } = await import('@/lib/utils/serpapi-monitor');
    
    // Check SerpAPI quota
    const stats = serpApiMonitor.getUsageStats();
    console.log(`📊 SerpAPI usage: ${stats.today.count}/${stats.today.limit} today, ${stats.monthly.count}/${stats.monthly.limit} monthly`);
    
    if (!serpApiMonitor.canMakeCall()) {
      return NextResponse.json({
        success: false,
        error: 'SerpAPI rate limit reached',
        usage: stats
      }, { status: 429 });
    }
    
    // Fetch latest trends from SerpAPI
    console.log('📡 Fetching trends from SerpAPI...');
    const trendsData = await googleTrendsService.getDailyTrends('US');
    
    if (!trendsData.topics || trendsData.topics.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No trends data received from Google Trends service'
      }, { status: 400 });
    }
    
    console.log(`✅ Received ${trendsData.topics.length} trends from SerpAPI`);
    
    // Save trends to Firebase
    console.log('💾 Saving trends to Firebase...');
    const batchId = await firebaseTrendsService.saveTrendsBatch(trendsData.topics);
    
    console.log(`✅ Trends saved to Firebase with batch ID: ${batchId}`);
    
    // Get updated usage stats
    const updatedStats = serpApiMonitor.getUsageStats();
    
    return NextResponse.json({
      success: true,
      message: 'Trends imported successfully',
      batchId: batchId,
      trendsCount: trendsData.topics.length,
      serpApiUsage: updatedStats,
      timestamp: new Date().toISOString(),
      trends: trendsData.topics.slice(0, 5).map((trend: any) => ({
        title: trend.title,
        traffic: trend.traffic,
        category: trend.category
      }))
    });

  } catch (error) {
    console.error('❌ Error in force trends import:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
