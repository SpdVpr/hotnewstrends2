import { NextRequest, NextResponse } from 'next/server';

// GET /api/check-firebase-rss - Check remaining RSS trends in Firebase
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking remaining RSS trends in Firebase...');
    
    // Import Firebase trends service
    const { firebaseTrendsService } = await import('@/lib/services/firebase-trends');
    
    // Get all trends from Firebase
    console.log('📊 Fetching all trends from Firebase...');
    const allTrends = await firebaseTrendsService.getLatestTrends(200); // Get more trends
    
    console.log(`📊 Found ${allTrends.length} total trends in Firebase`);
    
    // Filter RSS trends
    const rssTrends = allTrends.filter(trend => trend.source === 'RSS');
    const serpApiTrends = allTrends.filter(trend => trend.source === 'SerpAPI');
    const otherTrends = allTrends.filter(trend => trend.source !== 'SerpAPI' && trend.source !== 'RSS');
    
    console.log(`📈 Current breakdown: ${serpApiTrends.length} SerpAPI, ${rssTrends.length} RSS, ${otherTrends.length} other`);
    
    // Show details of remaining RSS trends
    const rssDetails = rssTrends.slice(0, 20).map(trend => ({
      id: trend.id,
      title: trend.title,
      source: trend.source,
      createdAt: trend.createdAt,
      searchVolume: trend.searchVolume
    }));
    
    // Show details of SerpAPI trends for comparison
    const serpApiDetails = serpApiTrends.slice(0, 10).map(trend => ({
      id: trend.id,
      title: trend.title,
      source: trend.source,
      createdAt: trend.createdAt,
      searchVolume: trend.searchVolume
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        totalTrends: allTrends.length,
        breakdown: {
          serpApi: serpApiTrends.length,
          rss: rssTrends.length,
          other: otherTrends.length
        },
        rssDetails: rssDetails,
        serpApiDetails: serpApiDetails,
        allSources: [...new Set(allTrends.map(t => t.source))].sort()
      }
    });

  } catch (error) {
    console.error('❌ Error checking Firebase RSS trends:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
