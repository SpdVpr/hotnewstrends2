import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging article generation system...');
    
    const { automatedArticleGenerator } = await import('@/lib/services/automated-article-generator');
    
    // Get current time info
    const now = new Date();
    const pragueTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Prague"}));
    const currentHour = pragueTime.getHours();
    const currentMinute = pragueTime.getMinutes();
    
    console.log(`🕐 Current time: ${pragueTime.toLocaleString()} Prague (Hour: ${currentHour}, Minute: ${currentMinute})`);
    
    // Get daily plan
    const stats = await automatedArticleGenerator.getStats();
    const dailyPlan = stats.dailyPlan;
    
    if (!dailyPlan) {
      return NextResponse.json({
        success: false,
        error: 'No daily plan found',
        debug: {
          currentHour,
          currentMinute,
          pragueTime: pragueTime.toISOString(),
          isRunning: stats.isRunning
        }
      });
    }
    
    console.log(`📅 Daily plan has ${dailyPlan.jobs.length} jobs`);
    
    // Find job for current hour
    const currentHourJob = dailyPlan.jobs.find(job => 
      job.position === currentHour + 1 && // Position 1 = hour 0, position 2 = hour 1, etc.
      job.status === 'pending'
    );
    
    // Show first 5 jobs
    const jobsInfo = dailyPlan.jobs.slice(0, 10).map(job => {
      const scheduledTime = job.scheduledAt ? new Date(job.scheduledAt) : null;
      const scheduledHour = scheduledTime ? scheduledTime.getUTCHours() : null;
      const isCurrentHour = job.position === currentHour + 1;
      const shouldGenerate = isCurrentHour && job.status === 'pending' && currentMinute <= 10;
      
      return {
        position: job.position,
        title: job.trend.title,
        status: job.status,
        scheduledAt: job.scheduledAt,
        scheduledHour,
        isCurrentHour,
        shouldGenerate
      };
    });
    
    // Check generation conditions
    const shouldGenerateNow = currentMinute <= 10; // Only in first 10 minutes of hour
    const hasCurrentHourJob = !!currentHourJob;
    const generationReady = shouldGenerateNow && hasCurrentHourJob;
    
    console.log(`🎯 Current hour job: ${currentHourJob ? `#${currentHourJob.position} "${currentHourJob.trend.title}"` : 'NONE'}`);
    console.log(`⏰ Should generate now: ${generationReady} (minute ${currentMinute} <= 10: ${shouldGenerateNow})`);
    
    return NextResponse.json({
      success: true,
      data: {
        currentTime: {
          prague: pragueTime.toISOString(),
          hour: currentHour,
          minute: currentMinute
        },
        dailyPlan: {
          totalJobs: dailyPlan.jobs.length,
          pendingJobs: dailyPlan.jobs.filter(j => j.status === 'pending').length,
          completedJobs: dailyPlan.jobs.filter(j => j.status === 'completed').length
        },
        currentHourJob: currentHourJob ? {
          position: currentHourJob.position,
          title: currentHourJob.trend.title,
          status: currentHourJob.status,
          scheduledAt: currentHourJob.scheduledAt
        } : null,
        generationConditions: {
          shouldGenerateNow,
          hasCurrentHourJob,
          generationReady,
          reason: !generationReady ? (
            !shouldGenerateNow ? `Too late in hour (minute ${currentMinute} > 10)` :
            !hasCurrentHourJob ? `No pending job for hour ${currentHour} (position ${currentHour + 1})` :
            'Unknown'
          ) : 'Ready to generate'
        },
        systemStatus: {
          isRunning: stats.isRunning,
          nextRun: stats.nextRun
        },
        jobsPreview: jobsInfo
      }
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'force-check') {
      console.log('🔄 Force checking scheduled articles...');
      
      const { automatedArticleGenerator } = await import('@/lib/services/automated-article-generator');
      
      // Call the private method using reflection
      const generator = automatedArticleGenerator as any;
      await generator.checkScheduledArticles();
      
      return NextResponse.json({
        success: true,
        message: 'Force check completed - see server logs for details'
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use force-check.'
    }, { status: 400 });
    
  } catch (error) {
    console.error('❌ Force check failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
