import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing Daily Plan refresh...');
    
    const { automatedArticleGenerator } = await import('@/lib/services/automated-article-generator');
    
    // Get stats before refresh
    const statsBefore = automatedArticleGenerator.getStats();
    console.log('📊 Daily Plan BEFORE refresh:', {
      totalJobs: statsBefore.totalJobs,
      pendingJobs: statsBefore.pendingJobs,
      completedJobs: statsBefore.completedJobs,
      hasDaily: !!statsBefore.dailyPlan
    });
    
    // Show first few jobs before refresh
    if (statsBefore.dailyPlan?.jobs) {
      console.log('📅 First 5 jobs BEFORE refresh:');
      statsBefore.dailyPlan.jobs.slice(0, 5).forEach(job => {
        console.log(`  #${job.position}: "${job.trend.title}" - Status: ${job.status} - Scheduled: ${job.scheduledAt ? new Date(job.scheduledAt).toLocaleString() : 'N/A'}`);
      });
    }
    
    // Perform refresh
    console.log('🔄 Calling refreshDailyPlan()...');
    await automatedArticleGenerator.refreshDailyPlan();
    console.log('✅ refreshDailyPlan() completed');
    
    // Get stats after refresh
    const statsAfter = automatedArticleGenerator.getStats();
    console.log('📊 Daily Plan AFTER refresh:', {
      totalJobs: statsAfter.totalJobs,
      pendingJobs: statsAfter.pendingJobs,
      completedJobs: statsAfter.completedJobs,
      hasDaily: !!statsAfter.dailyPlan
    });
    
    // Show first few jobs after refresh
    if (statsAfter.dailyPlan?.jobs) {
      console.log('📅 First 5 jobs AFTER refresh:');
      statsAfter.dailyPlan.jobs.slice(0, 5).forEach(job => {
        console.log(`  #${job.position}: "${job.trend.title}" - Status: ${job.status} - Scheduled: ${job.scheduledAt ? new Date(job.scheduledAt).toLocaleString() : 'N/A'}`);
      });
    }
    
    // Check if anything changed
    const changed = JSON.stringify(statsBefore.dailyPlan?.jobs.slice(0, 5)) !== JSON.stringify(statsAfter.dailyPlan?.jobs.slice(0, 5));
    console.log(`🔍 Daily Plan changed: ${changed ? 'YES' : 'NO'}`);
    
    return NextResponse.json({
      success: true,
      message: 'Daily Plan refresh test completed',
      data: {
        before: {
          totalJobs: statsBefore.totalJobs,
          pendingJobs: statsBefore.pendingJobs,
          completedJobs: statsBefore.completedJobs,
          firstJob: statsBefore.dailyPlan?.jobs[0] ? {
            title: statsBefore.dailyPlan.jobs[0].trend.title,
            status: statsBefore.dailyPlan.jobs[0].status,
            position: statsBefore.dailyPlan.jobs[0].position
          } : null
        },
        after: {
          totalJobs: statsAfter.totalJobs,
          pendingJobs: statsAfter.pendingJobs,
          completedJobs: statsAfter.completedJobs,
          firstJob: statsAfter.dailyPlan?.jobs[0] ? {
            title: statsAfter.dailyPlan.jobs[0].trend.title,
            status: statsAfter.dailyPlan.jobs[0].status,
            position: statsAfter.dailyPlan.jobs[0].position
          } : null
        },
        changed: changed
      }
    });
    
  } catch (error) {
    console.error('❌ Daily Plan refresh test failed:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
