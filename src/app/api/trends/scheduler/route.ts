/**
 * Trends Scheduler API
 * Manages the 6x daily trends update scheduler
 */

import { NextRequest, NextResponse } from 'next/server';
import { trendsScheduler } from '@/lib/services/trends-scheduler';
import { firebaseTrendsService } from '@/lib/services/firebase-trends';

// GET /api/trends/scheduler - Get scheduler status and stats
export async function GET() {
  try {
    const schedulerStats = trendsScheduler.getStats();

    // Try to get Firebase stats, but don't fail if it doesn't work
    let trendsStats = {
      total: 0,
      needingArticles: 0,
      articlesGenerated: 0,
      latestBatchId: null
    };

    try {
      trendsStats = await firebaseTrendsService.getTrendsStats();
    } catch (firebaseError) {
      console.warn('⚠️ Firebase trends stats failed, using defaults:', firebaseError);
    }

    return NextResponse.json({
      success: true,
      data: {
        scheduler: {
          ...schedulerStats,
          timeUntilNextUpdate: trendsScheduler.getTimeUntilNextUpdateFormatted()
        },
        trends: trendsStats
      }
    });
  } catch (error) {
    console.error('❌ Error getting scheduler status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get scheduler status' },
      { status: 500 }
    );
  }
}

// POST /api/trends/scheduler - Control scheduler (start/stop/force-update)
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'start':
        trendsScheduler.start();
        return NextResponse.json({
          success: true,
          message: 'Trends scheduler started (3x daily updates)',
          data: trendsScheduler.getStats()
        });

      case 'stop':
        trendsScheduler.stop();
        return NextResponse.json({
          success: true,
          message: 'Trends scheduler stopped',
          data: trendsScheduler.getStats()
        });

      case 'force-update':
        // Run force update in background
        trendsScheduler.forceUpdate().catch(error => {
          console.error('❌ Force update failed:', error);
        });
        
        return NextResponse.json({
          success: true,
          message: 'Force update initiated',
          data: trendsScheduler.getStats()
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: start, stop, or force-update' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Error controlling scheduler:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to control scheduler' },
      { status: 500 }
    );
  }
}
