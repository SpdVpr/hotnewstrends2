import { NextRequest, NextResponse } from 'next/server';

// POST /api/force-trends-update - Disabled to prevent SerpAPI usage
export async function POST(request: NextRequest) {
  try {
    console.log('🚫 Force trends update disabled to conserve SerpAPI quota');

    return NextResponse.json({
      success: false,
      error: 'Force trends update is disabled to conserve SerpAPI quota. Only scheduled updates are allowed.',
      message: 'Use the automatic scheduler which updates 6 times per day'
    }, { status: 403 });
    
    console.log(`📊 Received ${trendsData.topics.length} trends from ${trendsData.source}`);
    
    // Count SerpAPI vs RSS
    const serpApiCount = trendsData.topics.filter(t => t.source === 'SerpAPI').length;
    const rssCount = trendsData.topics.filter(t => t.source === 'RSS').length;
    
    console.log(`📈 Breakdown: ${serpApiCount} SerpAPI + ${rssCount} RSS = ${trendsData.topics.length} total`);
    
    // Save to Firebase
    console.log('💾 Saving trends to Firebase...');
    const batchId = await firebaseTrendsService.saveTrendsBatch(trendsData.topics);
    
    console.log(`✅ Trends saved to Firebase with batch ID: ${batchId}`);
    
    // Trigger daily plan refresh
    console.log('🔄 Refreshing daily plan...');
    try {
      const { automatedArticleGenerator } = await import('@/lib/services/automated-article-generator');
      await automatedArticleGenerator.refreshDailyPlan();
      console.log('✅ Daily plan refreshed');
    } catch (refreshError) {
      console.warn('⚠️ Daily plan refresh failed:', refreshError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Trends updated successfully',
      data: {
        totalTrends: trendsData.topics.length,
        serpApiTrends: serpApiCount,
        rssTrends: rssCount,
        source: trendsData.source,
        batchId: batchId,
        firstTrend: trendsData.topics[0] ? {
          title: trendsData.topics[0].title,
          source: trendsData.topics[0].source,
          searchVolume: trendsData.topics[0].searchVolume
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Force trends update failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
