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
    
    // Import services
    console.log('📦 Importing services...');
    const { googleTrendsService } = await import('@/lib/services/google-trends');
    const { firebaseTrendsService } = await import('@/lib/services/firebase-trends');
    
    // Fetch latest trends from SerpAPI only (no RSS)
    console.log('📡 Fetching trends from SerpAPI...');
    const trendsData = await googleTrendsService.getDailyTrends('US');
    
    if (!trendsData.topics || trendsData.topics.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No trends data received from Google Trends service',
        details: 'SerpAPI returned empty or invalid data'
      }, { status: 400 });
    }
    
    console.log(`📊 Received ${trendsData.topics.length} trends from ${trendsData.source}`);
    
    // Count SerpAPI vs RSS
    const serpApiCount = trendsData.topics.filter(t => t.source === 'SerpAPI').length;
    const rssCount = trendsData.topics.filter(t => t.source === 'RSS').length;
    
    console.log(`📈 Breakdown: ${serpApiCount} SerpAPI + ${rssCount} RSS = ${trendsData.topics.length} total`);
    
    // Save trends to Firebase
    console.log('💾 Saving trends to Firebase...');
    const saveResults = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const trend of trendsData.topics) {
      try {
        const savedTrend = await firebaseTrendsService.saveTrend(trend);
        saveResults.push({
          title: trend.title,
          status: 'success',
          id: savedTrend.id
        });
        successCount++;
      } catch (error) {
        saveResults.push({
          title: trend.title,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        errorCount++;
        console.error(`❌ Failed to save trend "${trend.title}":`, error);
      }
    }
    
    console.log(`✅ Trends update completed: ${successCount} saved, ${errorCount} failed`);
    
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
