import { NextRequest, NextResponse } from 'next/server';

// GET /api/cleanup-firebase-round2 - Second round cleanup for remaining RSS trends
export async function GET(request: NextRequest) {
  return performSecondCleanup();
}

// POST /api/cleanup-firebase-round2 - Second round cleanup for remaining RSS trends
export async function POST(request: NextRequest) {
  return performSecondCleanup();
}

async function performSecondCleanup() {
  try {
    console.log('🧹 Starting Firebase cleanup ROUND 2 - targeting remaining RSS trends...');
    
    // Import Firebase trends service
    const { firebaseTrendsService } = await import('@/lib/services/firebase-trends');
    
    // Get more trends from Firebase (increase limit)
    console.log('📊 Fetching MORE trends from Firebase...');
    const allTrends = await firebaseTrendsService.getLatestTrends(500); // Get more trends
    
    console.log(`📊 Found ${allTrends.length} total trends in Firebase`);
    
    // Count trends by source
    const serpApiTrends = allTrends.filter(trend => trend.source === 'SerpAPI');
    const rssTrends = allTrends.filter(trend => trend.source === 'RSS');
    const otherTrends = allTrends.filter(trend => trend.source !== 'SerpAPI' && trend.source !== 'RSS');
    
    console.log(`📈 Round 2 breakdown: ${serpApiTrends.length} SerpAPI, ${rssTrends.length} RSS, ${otherTrends.length} other`);
    
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
    
    // Delete remaining RSS trends from Firebase
    console.log(`🗑️ Round 2: Removing ${rssTrends.length} remaining RSS trends from Firebase...`);
    
    let deletedCount = 0;
    const failedDeletes = [];
    
    for (const rssTrend of rssTrends) {
      try {
        await firebaseTrendsService.deleteTrend(rssTrend.id);
        deletedCount++;
        
        if (deletedCount % 5 === 0) {
          console.log(`🗑️ Round 2: Deleted ${deletedCount}/${rssTrends.length} RSS trends...`);
        }
      } catch (deleteError) {
        console.warn(`⚠️ Round 2: Failed to delete RSS trend ${rssTrend.id}:`, deleteError);
        failedDeletes.push({
          id: rssTrend.id,
          title: rssTrend.title,
          error: deleteError instanceof Error ? deleteError.message : 'Unknown error'
        });
      }
    }
    
    console.log(`✅ Round 2 Firebase cleanup completed: ${deletedCount} RSS trends removed`);
    
    // Verify cleanup
    const remainingTrends = await firebaseTrendsService.getLatestTrends(200);
    const remainingRss = remainingTrends.filter(trend => trend.source === 'RSS');
    const remainingSerpApi = remainingTrends.filter(trend => trend.source === 'SerpAPI');
    
    return NextResponse.json({
      success: true,
      message: `Round 2 Firebase cleanup completed successfully`,
      data: {
        round2Results: {
          rssFound: rssTrends.length,
          rssDeleted: deletedCount,
          failedDeletes: failedDeletes.length,
          failedDetails: failedDeletes.slice(0, 10) // Show first 10 failures
        },
        finalState: {
          totalTrends: remainingTrends.length,
          serpApiTrends: remainingSerpApi.length,
          rssRemaining: remainingRss.length
        },
        isClean: remainingRss.length === 0
      }
    });

  } catch (error) {
    console.error('❌ Round 2 Firebase cleanup failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
