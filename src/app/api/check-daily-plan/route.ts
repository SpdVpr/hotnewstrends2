import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking current daily plan...');
    
    const { automatedArticleGenerator } = await import('@/lib/services/automated-article-generator');
    
    // Get current date
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Checking daily plan for ${today}`);
    
    // Get current daily plan
    const generator = automatedArticleGenerator as any;
    const currentPlan = await generator.getDailyPlan(today);
    
    if (!currentPlan) {
      return NextResponse.json({
        success: false,
        message: 'No daily plan found for today',
        date: today
      });
    }
    
    console.log(`📋 Found daily plan with ${currentPlan.jobs.length} jobs`);
    
    // Show all jobs with their details
    const jobDetails = currentPlan.jobs.map((job, index) => {
      const scheduledTime = new Date(job.scheduledAt);
      return {
        position: job.position,
        title: job.trend.title,
        searchVolume: job.trend.searchVolume,
        status: job.status,
        scheduledAt: job.scheduledAt,
        scheduledTime: scheduledTime.toLocaleTimeString(),
        scheduledHour: scheduledTime.getHours()
      };
    });
    
    console.log('📅 Current daily plan jobs:');
    jobDetails.forEach(job => {
      console.log(`  #${job.position}: "${job.title}" at ${job.scheduledTime} (${job.status})`);
    });
    
    return NextResponse.json({
      success: true,
      message: `Daily plan found with ${currentPlan.jobs.length} jobs`,
      data: {
        date: today,
        totalJobs: currentPlan.jobs.length,
        createdAt: currentPlan.createdAt,
        updatedAt: currentPlan.updatedAt,
        jobs: jobDetails
      }
    });
    
  } catch (error) {
    console.error('❌ Daily plan check failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
