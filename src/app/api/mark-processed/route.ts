import { NextRequest, NextResponse } from 'next/server';
import { firebaseProcessedTopicsService } from '@/lib/services/firebase-processed-topics';

// POST /api/mark-processed - Manually mark a topic as processed
export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json();
    
    if (!keyword) {
      return NextResponse.json({
        success: false,
        error: 'Keyword is required'
      }, { status: 400 });
    }
    
    console.log(`🚫 Manually marking "${keyword}" as processed...`);
    
    await firebaseProcessedTopicsService.markTopicAsProcessed(keyword);
    
    return NextResponse.json({
      success: true,
      message: `Topic "${keyword}" marked as processed`,
      data: {
        keyword,
        processedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error marking topic as processed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to mark topic as processed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
