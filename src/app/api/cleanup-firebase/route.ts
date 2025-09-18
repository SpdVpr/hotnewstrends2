import { NextRequest, NextResponse } from 'next/server';

// POST /api/cleanup-firebase - Remove all RSS trends from Firebase, keep only SerpAPI
export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting Firebase cleanup - removing RSS trends, keeping only SerpAPI...');
    
    // Import Firebase trends service
    const { firebaseTrendsService } = await import('@/lib/services/firebase-trends');
    
    // Get all trends from Firebase
    console.log('📊 Fetching all trends from Firebase...');
    const allTrends = await firebaseTrendsService.getLatestTrends(1000); // Get up to 1000 trends
    
    console.log(`📊 Found ${allTrends.length} total trends in Firebase`);
    
    // Count trends by source
    const serpApiTrends = allTrends.filter(trend => trend.source === 'SerpAPI');
    const rssTrends = allTrends.filter(trend => trend.source === 'RSS');
    const otherTrends = allTrends.filter(trend => trend.source !== 'SerpAPI' && trend.source !== 'RSS');
    
    console.log(`📈 Breakdown: ${serpApiTrends.length} SerpAPI, ${rssTrends.length} RSS, ${otherTrends.length} other`);
    
    if (rssTrends.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No RSS trends found - Firebase is already clean',
        data: {
          totalTrends: allTrends.length,
          serpApiTrends: serpApiTrends.length,
          rssRemoved: 0,
          otherTrends: otherTrends.length
        }
      });
    }
    
    // Delete RSS trends from Firebase
    console.log(`🗑️ Removing ${rssTrends.length} RSS trends from Firebase...`);
    
    let deletedCount = 0;
    for (const rssTrend of rssTrends) {
      try {
        await firebaseTrendsService.deleteTrend(rssTrend.id);
        deletedCount++;
        
        if (deletedCount % 10 === 0) {
          console.log(`🗑️ Deleted ${deletedCount}/${rssTrends.length} RSS trends...`);
        }
      } catch (deleteError) {
        console.warn(`⚠️ Failed to delete RSS trend ${rssTrend.id}:`, deleteError);
      }
    }
    
    console.log(`✅ Firebase cleanup completed: ${deletedCount} RSS trends removed`);
    
    // Verify cleanup
    const remainingTrends = await firebaseTrendsService.getLatestTrends(100);
    const remainingRss = remainingTrends.filter(trend => trend.source === 'RSS');
    const remainingSerpApi = remainingTrends.filter(trend => trend.source === 'SerpAPI');
    
    return NextResponse.json({
      success: true,
      message: `Firebase cleanup completed successfully`,
      data: {
        originalTotal: allTrends.length,
        rssRemoved: deletedCount,
        remainingTotal: remainingTrends.length,
        remainingSerpApi: remainingSerpApi.length,
        remainingRss: remainingRss.length,
        breakdown: {
          before: {
            total: allTrends.length,
            serpApi: serpApiTrends.length,
            rss: rssTrends.length,
            other: otherTrends.length
          },
          after: {
            total: remainingTrends.length,
            serpApi: remainingSerpApi.length,
            rss: remainingRss.length
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Firebase cleanup failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
