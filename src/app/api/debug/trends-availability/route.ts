import { NextRequest, NextResponse } from 'next/server';

// GET /api/debug/trends-availability - Check how many trends are available for daily plan
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking trends availability for daily plan...');
    
    const { firebaseTrendsService } = await import('@/lib/services/firebase-trends');
    
    // Get trends stats
    const stats = await firebaseTrendsService.getTrendsStats();
    console.log(`📊 Firebase trends stats:`, stats);
    
    // Get trends needing articles (what daily plan uses)
    const trendsNeeding50 = await firebaseTrendsService.getTrendsNeedingArticles(50);
    console.log(`📊 Trends needing articles (limit 50): ${trendsNeeding50.length}`);
    
    // Get latest trends (all available)
    const latestTrends = await firebaseTrendsService.getLatestTrends(100);
    console.log(`📊 Latest trends (limit 100): ${latestTrends.length}`);
    
    // Analyze the gap
    const gap = 24 - trendsNeeding50.length;
    let recommendation = '';
    
    if (trendsNeeding50.length >= 24) {
      recommendation = '✅ Sufficient trends available for full daily plan (24 articles)';
    } else if (trendsNeeding50.length >= 15) {
      recommendation = `⚠️ Only ${trendsNeeding50.length} trends available. Daily plan will be incomplete. Consider importing more trends or cleaning up processed_topics.`;
    } else {
      recommendation = `❌ CRITICAL: Only ${trendsNeeding50.length} trends available! Daily plan will be severely incomplete. Immediate action needed: import more trends or clean up processed_topics collection.`;
    }
    
    return NextResponse.json({
      success: true,
      data: {
        stats,
        trendsNeedingArticles: trendsNeeding50.length,
        latestTrendsCount: latestTrends.length,
        gap: gap > 0 ? gap : 0,
        recommendation,
        sampleTrendsNeeding: trendsNeeding50.slice(0, 5).map(t => ({
          title: t.title,
          searchVolume: t.searchVolume,
          category: t.category,
          articleGenerated: t.articleGenerated
        })),
        sampleLatestTrends: latestTrends.slice(0, 5).map(t => ({
          title: t.title,
          searchVolume: t.searchVolume,
          category: t.category,
          articleGenerated: t.articleGenerated
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking trends availability:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

