import { NextRequest, NextResponse } from 'next/server';
import { firebaseTrendsService } from '@/lib/services/firebase-trends';

// GET /api/firebase-trends - Get trends directly from Firebase
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const needingArticles = searchParams.get('needingArticles') === 'true';
    
    console.log(`🔍 Fetching ${needingArticles ? 'trends needing articles' : 'latest trends'} from Firebase (limit: ${limit})`);
    
    let trends;
    if (needingArticles) {
      trends = await firebaseTrendsService.getTrendsNeedingArticles(limit);
    } else {
      trends = await firebaseTrendsService.getLatestTrends(limit);
    }
    
    console.log(`📊 Retrieved ${trends.length} trends from Firebase`);
    
    return NextResponse.json({
      success: true,
      data: {
        trends: trends, // Changed from topics to trends to match GoogleTrendsPanel expectation
        total: trends.length,
        source: 'Firebase',
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching Firebase trends:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch Firebase trends',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
