import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing article generation (bypassing time restrictions)...');
    
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
        error: 'No daily plan found'
      });
    }
    
    // Find job for current hour
    const currentHourJob = dailyPlan.jobs.find(job => 
      job.position === currentHour + 1 && // Position 1 = hour 0, position 2 = hour 1, etc.
      job.status === 'pending'
    );
    
    if (!currentHourJob) {
      return NextResponse.json({
        success: false,
        error: `No pending job for hour ${currentHour} (position ${currentHour + 1})`,
        data: {
          currentHour,
          position: currentHour + 1,
          pendingJobs: dailyPlan.jobs.filter(j => j.status === 'pending').map(j => ({
            position: j.position,
            title: j.trend.title,
            status: j.status
          }))
        }
      });
    }
    
    console.log(`🎯 Found job for current hour ${currentHour}: #${currentHourJob.position} "${currentHourJob.trend.title}"`);
    
    // Force process the job (bypass time restrictions)
    const generator = automatedArticleGenerator as any;
    await generator.processGenerationJob(currentHourJob);
    
    return NextResponse.json({
      success: true,
      message: `Test generation completed for job #${currentHourJob.position}`,
      data: {
        position: currentHourJob.position,
        title: currentHourJob.trend.title,
        currentHour,
        currentMinute
      }
    });
    
  } catch (error) {
    console.error('❌ Test generation failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
