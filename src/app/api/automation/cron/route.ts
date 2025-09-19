import { NextRequest, NextResponse } from 'next/server';
import { automatedArticleGenerator } from '@/lib/services/automated-article-generator';

// GET /api/automation/cron - Cron job endpoint for Vercel
// This will be called by external cron service or Vercel cron
export async function GET(request: NextRequest) {
  try {
    console.log('⏰ Cron job triggered for article generation check...');
    
    // Verify this is a legitimate cron call (optional security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('🚫 Unauthorized cron job attempt');
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const now = new Date();
    const pragueTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Prague"}));
    const currentHour = pragueTime.getHours();
    const currentMinute = pragueTime.getMinutes();

    console.log(`⏰ Cron check at ${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')} Prague time`);

    // Process articles for current hour (remove minute restriction for testing)
    console.log(`🎯 Processing articles for hour ${currentHour}`);

    try {
      // Ensure we have a daily plan
      await automatedArticleGenerator.ensureDailyPlan();

      // Process scheduled jobs for current hour
      await automatedArticleGenerator.processScheduledJobs();

      const result = {
        success: true,
        timestamp: new Date().toISOString(),
        pragueTime: pragueTime.toISOString(),
        currentHour,
        currentMinute,
        action: 'processed_scheduled_jobs',
        message: `Processed scheduled jobs for hour ${currentHour}`
      };

      console.log('✅ Cron job completed successfully:', result);
      return NextResponse.json(result);

    } catch (error) {
      console.error('❌ Error in cron job processing:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        pragueTime: pragueTime.toISOString(),
        currentHour,
        currentMinute
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Critical error in cron job:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST /api/automation/cron - Manual trigger for testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { force = false } = body;

    console.log('🔧 Manual cron trigger:', { force });

    const now = new Date();
    const pragueTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Prague"}));
    const currentHour = pragueTime.getHours();
    const currentMinute = pragueTime.getMinutes();

    if (force || currentMinute <= 10) {
      console.log(`🎯 Force processing articles for hour ${currentHour}`);
      
      try {
        await automatedArticleGenerator.ensureDailyPlan();
        await automatedArticleGenerator.processScheduledJobs();
        
        return NextResponse.json({
          success: true,
          timestamp: new Date().toISOString(),
          pragueTime: pragueTime.toISOString(),
          currentHour,
          currentMinute,
          action: 'force_processed',
          message: `Force processed scheduled jobs for hour ${currentHour}`
        });

      } catch (error) {
        console.error('❌ Error in manual cron processing:', error);
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }

    } else {
      return NextResponse.json({
        success: false,
        message: `Not the right time for article generation (${currentHour}:${currentMinute.toString().padStart(2, '0')}). Use force=true to override.`,
        timestamp: new Date().toISOString(),
        pragueTime: pragueTime.toISOString()
      }, { status:400 });
    }

  } catch (error) {
    console.error('❌ Error in manual cron trigger:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
