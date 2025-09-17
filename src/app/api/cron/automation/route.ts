import { NextRequest, NextResponse } from 'next/server';
import { automationService } from '@/lib/services/automation';

// This endpoint is designed to be called by cron services like Vercel Cron or external cron jobs
// GET /api/cron/automation - Trigger automation cycle
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a legitimate cron service
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🕐 Cron job triggered: Starting automation cycle');

    // Check if automation is enabled
    const config = automationService.getConfig();
    if (!config.enabled) {
      console.log('⏸️ Automation is disabled, skipping cycle');
      return NextResponse.json({
        success: true,
        message: 'Automation is disabled',
        skipped: true
      });
    }

    // Start automation service if not running
    if (!automationService.getStats().isRunning) {
      await automationService.start();
    }

    // Get current stats
    const stats = automationService.getStats();

    return NextResponse.json({
      success: true,
      message: 'Automation cycle completed',
      data: {
        isRunning: stats.isRunning,
        todayJobs: stats.todayJobs,
        totalJobs: stats.totalJobs,
        completedJobs: stats.completedJobs,
        failedJobs: stats.failedJobs,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error in cron automation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Cron automation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/cron/automation - Manual trigger with parameters
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { forceRun = false, maxArticles } = body;

    console.log('🕐 Manual cron trigger with parameters:', { forceRun, maxArticles });

    // Update config if maxArticles is provided
    if (maxArticles && typeof maxArticles === 'number' && maxArticles > 0) {
      automationService.updateConfig({ maxArticlesPerDay: maxArticles });
    }

    // Force run even if disabled
    if (forceRun) {
      automationService.updateConfig({ enabled: true });
    }

    // Start automation
    await automationService.start();

    const stats = automationService.getStats();

    return NextResponse.json({
      success: true,
      message: 'Manual cron automation completed',
      data: {
        isRunning: stats.isRunning,
        todayJobs: stats.todayJobs,
        totalJobs: stats.totalJobs,
        config: stats.config,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error in manual cron automation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Manual cron automation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
