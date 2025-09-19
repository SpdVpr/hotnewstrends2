import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Resetting daily plan completely...');
    
    const { automatedArticleGenerator } = await import('@/lib/services/automated-article-generator');
    
    // Get current date
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Resetting daily plan for ${today}`);
    
    // Force delete the existing daily plan by creating a completely new one
    // This bypasses the preservation logic in refreshDailyPlan
    const generator = automatedArticleGenerator as any;
    
    // Create a fresh daily plan (this will overwrite the existing one)
    console.log('🗑️ Deleting old daily plan and creating fresh one...');
    const newPlan = await generator.createFreshDailyPlan(today);
    
    console.log(`✅ Fresh daily plan created with ${newPlan.jobs.length} jobs`);
    
    // Show first few jobs with their new times
    console.log('📅 New schedule (first 5 jobs):');
    newPlan.jobs.slice(0, 5).forEach((job, index) => {
      const scheduledTime = new Date(job.scheduledAt);
      console.log(`  #${job.position}: "${job.trend.title}" at ${scheduledTime.toLocaleTimeString()}`);
    });
    
    return NextResponse.json({
      success: true,
      message: `Daily plan completely reset with ${newPlan.jobs.length} jobs`,
      data: {
        totalJobs: newPlan.jobs.length,
        sampleJobs: newPlan.jobs.slice(0, 5).map(job => ({
          position: job.position,
          title: job.trend.title,
          scheduledAt: job.scheduledAt,
          scheduledTime: new Date(job.scheduledAt).toLocaleTimeString()
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Daily plan reset failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
