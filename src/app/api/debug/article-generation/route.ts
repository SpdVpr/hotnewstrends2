import { NextRequest, NextResponse } from 'next/server';

// GET /api/debug/article-generation - Debug article generation status
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging article generation status...');
    
    // Get current Prague time
    const now = new Date();
    const pragueTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Prague" }));
    const currentHour = pragueTime.getHours();
    const currentMinute = pragueTime.getMinutes();
    
    console.log(`🕐 Current Prague time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
    
    // Import services
    const { automatedArticleGenerator } = await import('@/lib/services/automated-article-generator');
    
    // Get daily plan
    const dailyPlan = await automatedArticleGenerator.getDailyPlan();
    
    if (!dailyPlan) {
      return NextResponse.json({
        success: false,
        error: 'No daily plan found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Analyze jobs
    const allJobs = dailyPlan.jobs || [];
    const pendingJobs = allJobs.filter(job => job.status === 'pending');
    const generatingJobs = allJobs.filter(job => job.status === 'generating');
    const completedJobs = allJobs.filter(job => job.status === 'completed');
    
    // Find job for current hour
    const currentHourJob = allJobs.find(job => {
      if (!job.scheduledAt) return false;
      const scheduledTime = new Date(job.scheduledAt);
      const scheduledHour = scheduledTime.getHours();
      return scheduledHour === currentHour;
    });
    
    // Find next pending job
    const nextPendingJob = pendingJobs.length > 0 ? pendingJobs[0] : null;
    
    // Check if within time window
    const withinTimeWindow = currentMinute <= 10;
    
    return NextResponse.json({
      success: true,
      debug: {
        currentTime: {
          prague: pragueTime.toISOString(),
          hour: currentHour,
          minute: currentMinute,
          withinTimeWindow
        },
        dailyPlan: {
          totalJobs: allJobs.length,
          pending: pendingJobs.length,
          generating: generatingJobs.length,
          completed: completedJobs.length
        },
        currentHourJob: currentHourJob ? {
          position: currentHourJob.position,
          title: currentHourJob.trend?.title,
          status: currentHourJob.status,
          scheduledAt: currentHourJob.scheduledAt,
          scheduledHour: currentHourJob.scheduledAt ? new Date(currentHourJob.scheduledAt).getHours() : null
        } : null,
        nextPendingJob: nextPendingJob ? {
          position: nextPendingJob.position,
          title: nextPendingJob.trend?.title,
          status: nextPendingJob.status,
          scheduledAt: nextPendingJob.scheduledAt,
          scheduledHour: nextPendingJob.scheduledAt ? new Date(nextPendingJob.scheduledAt).getHours() : null
        } : null,
        generatingJobs: generatingJobs.map(job => ({
          position: job.position,
          title: job.trend?.title,
          status: job.status,
          scheduledAt: job.scheduledAt,
          startedAt: job.startedAt
        })),
        recentJobs: allJobs.slice(-5).map(job => ({
          position: job.position,
          title: job.trend?.title,
          status: job.status,
          scheduledAt: job.scheduledAt,
          scheduledHour: job.scheduledAt ? new Date(job.scheduledAt).getHours() : null
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in article generation debug:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
