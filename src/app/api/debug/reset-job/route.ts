import { NextRequest, NextResponse } from 'next/server';

// POST /api/debug/reset-job - Reset specific job status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { position, status = 'completed' } = body;
    
    if (!position) {
      return NextResponse.json({
        success: false,
        error: 'Position parameter required (e.g., 7 for job #7)'
      }, { status: 400 });
    }
    
    console.log(`🔧 Resetting job #${position} to status: ${status}...`);
    
    // Import services
    const { automatedArticleGenerator } = await import('@/lib/services/automated-article-generator');
    
    // Get daily plan
    const dailyPlan = await automatedArticleGenerator.getDailyPlan();
    
    if (!dailyPlan) {
      return NextResponse.json({
        success: false,
        error: 'No daily plan found'
      });
    }
    
    // Find the job
    const job = dailyPlan.jobs.find(j => j.position === parseInt(position));
    
    if (!job) {
      return NextResponse.json({
        success: false,
        error: `Job #${position} not found in daily plan`,
        availableJobs: dailyPlan.jobs.map(j => ({
          position: j.position,
          title: j.trend?.title,
          status: j.status
        }))
      });
    }
    
    const oldStatus = job.status;
    
    // Reset job status
    job.status = status;
    
    if (status === 'completed') {
      job.completedAt = new Date().toISOString();
      job.startedAt = job.startedAt || new Date().toISOString();
    } else if (status === 'pending') {
      job.startedAt = undefined;
      job.completedAt = undefined;
      job.error = undefined;
    }
    
    // Save updated plan
    await automatedArticleGenerator.saveDailyPlan(dailyPlan);
    
    console.log(`✅ Job #${position} reset from "${oldStatus}" to "${status}"`);
    
    return NextResponse.json({
      success: true,
      message: `Job #${position} reset from "${oldStatus}" to "${status}"`,
      job: {
        position: job.position,
        title: job.trend?.title,
        oldStatus,
        newStatus: job.status,
        startedAt: job.startedAt,
        completedAt: job.completedAt
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error resetting job:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
