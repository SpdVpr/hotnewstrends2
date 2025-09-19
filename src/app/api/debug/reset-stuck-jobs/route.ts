import { NextRequest, NextResponse } from 'next/server';

// POST /api/debug/reset-stuck-jobs - Reset jobs that are stuck in generating status
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Resetting stuck jobs...');
    
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
    
    // Find jobs stuck in generating status
    const generatingJobs = dailyPlan.jobs.filter(job => job.status === 'generating');
    
    if (generatingJobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stuck jobs found',
        generatingJobs: 0
      });
    }
    
    console.log(`🔍 Found ${generatingJobs.length} jobs stuck in generating status`);
    
    // Check if jobs are truly stuck (generating for more than 10 minutes)
    const now = new Date();
    const stuckJobs = generatingJobs.filter(job => {
      if (!job.startedAt) return true; // No start time = definitely stuck
      
      const startTime = new Date(job.startedAt);
      const minutesGenerating = (now.getTime() - startTime.getTime()) / (1000 * 60);
      
      return minutesGenerating > 10; // Stuck if generating for more than 10 minutes
    });
    
    if (stuckJobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Found generating jobs but they are not stuck yet (< 10 minutes)',
        generatingJobs: generatingJobs.length,
        jobsInfo: generatingJobs.map(job => ({
          position: job.position,
          title: job.trend?.title,
          startedAt: job.startedAt,
          minutesGenerating: job.startedAt ? Math.round((now.getTime() - new Date(job.startedAt).getTime()) / (1000 * 60)) : 'unknown'
        }))
      });
    }
    
    console.log(`🚨 Found ${stuckJobs.length} truly stuck jobs, resetting...`);
    
    // Reset stuck jobs to pending status
    const resetResults = [];
    
    for (const job of stuckJobs) {
      try {
        // Reset job status
        job.status = 'pending';
        job.startedAt = undefined;
        job.completedAt = undefined;
        job.error = undefined;
        
        resetResults.push({
          position: job.position,
          title: job.trend?.title,
          status: 'reset_to_pending',
          wasGeneratingFor: job.startedAt ? Math.round((now.getTime() - new Date(job.startedAt).getTime()) / (1000 * 60)) : 'unknown'
        });
        
        console.log(`✅ Reset job #${job.position}: "${job.trend?.title}"`);
        
      } catch (resetError) {
        console.error(`❌ Error resetting job #${job.position}:`, resetError);
        resetResults.push({
          position: job.position,
          title: job.trend?.title,
          status: 'reset_failed',
          error: resetError instanceof Error ? resetError.message : 'Unknown error'
        });
      }
    }
    
    // Save updated daily plan
    try {
      await automatedArticleGenerator.saveDailyPlan(dailyPlan);
      console.log('💾 Updated daily plan saved');
    } catch (saveError) {
      console.error('❌ Error saving updated daily plan:', saveError);
      return NextResponse.json({
        success: false,
        error: 'Failed to save updated daily plan',
        resetResults
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Reset ${stuckJobs.length} stuck jobs to pending status`,
      stuckJobsFound: stuckJobs.length,
      totalGeneratingJobs: generatingJobs.length,
      resetResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error resetting stuck jobs:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
