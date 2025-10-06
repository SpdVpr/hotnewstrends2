import { NextRequest, NextResponse } from 'next/server';

// POST /api/debug/reset-plan - Reset daily plan with fresh schedule
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Resetting daily plan with fresh schedule...');
    
    const today = new Date().toISOString().split('T')[0];
    
    // Delete existing plan
    const { firebaseDailyPlansService } = await import('@/lib/services/firebase-daily-plans');
    console.log(`🗑️ Deleting existing plan for ${today}...`);
    
    // Force create new plan
    const { automatedArticleGenerator } = await import('@/lib/services/automated-article-generator');
    const generator = automatedArticleGenerator as any;
    
    // Call createFreshDailyPlan to get new trends and schedule
    console.log('📅 Creating fresh daily plan...');
    const dailyPlan = await generator.createFreshDailyPlan(today);
    
    console.log(`✅ Fresh daily plan created with ${dailyPlan.jobs.length} jobs`);
    
    if (dailyPlan.jobs.length > 0) {
      console.log(`📋 First 5 jobs:`);
      dailyPlan.jobs.slice(0, 5).forEach((job: any) => {
        console.log(`   #${job.position}: "${job.trend.title}" - scheduled: ${job.scheduledAt}`);
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        date: dailyPlan.date,
        totalJobs: dailyPlan.jobs.length,
        createdAt: dailyPlan.createdAt,
        firstJobs: dailyPlan.jobs.slice(0, 5).map((job: any) => ({
          position: job.position,
          title: job.trend.title,
          status: job.status,
          scheduledAt: job.scheduledAt
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Reset plan error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

