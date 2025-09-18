import { NextRequest, NextResponse } from 'next/server';
import { automatedArticleGenerator } from '@/lib/services/automated-article-generator';

export async function GET(request: NextRequest) {
  try {
    const stats = automatedArticleGenerator.getStats();
    
    return NextResponse.json({
      success: true,
      data: {
        dailyPlan: stats.dailyPlan,
        nextScheduledJob: stats.nextScheduledJob,
        isRunning: stats.isRunning,
        stats: {
          totalJobs: stats.totalJobs,
          pendingJobs: stats.pendingJobs,
          generatingJobs: stats.generatingJobs,
          completedJobs: stats.completedJobs,
          failedJobs: stats.failedJobs,
          rejectedJobs: stats.rejectedJobs,
          todayJobs: stats.todayJobs
        }
      }
    });
  } catch (error) {
    console.error('Error fetching daily plan:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch daily plan'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'refresh') {
      try {
        console.log('🔄 Starting daily plan refresh...');
        await automatedArticleGenerator.refreshDailyPlan();
        console.log('✅ Daily plan refresh completed');

        return NextResponse.json({
          success: true,
          message: 'Daily plan refreshed successfully'
        });
      } catch (refreshError) {
        console.error('❌ Daily plan refresh failed:', refreshError);
        return NextResponse.json({
          success: false,
          error: 'Failed to refresh daily plan',
          details: refreshError instanceof Error ? refreshError.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    if (action === 'reset-failed') {
      await automatedArticleGenerator.resetFailedJobs();

      return NextResponse.json({
        success: true,
        message: 'Failed jobs reset successfully'
      });
    }

    if (action === 'test-mode') {
      await automatedArticleGenerator.enableTestMode();

      return NextResponse.json({
        success: true,
        message: 'Test mode enabled - articles will generate every 5 minutes'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });
    
  } catch (error) {
    console.error('Error updating daily plan:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update daily plan'
    }, { status: 500 });
  }
}
