import { NextRequest, NextResponse } from 'next/server';

// POST /api/debug/create-plan - Debug daily plan creation
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Starting daily plan creation...');
    
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Date: ${today}`);
    
    // Step 1: Check Firebase trends
    console.log('\n1️⃣ Checking Firebase trends...');
    const { firebaseTrendsService } = await import('@/lib/services/firebase-trends');
    
    try {
      const trends = await firebaseTrendsService.getTrendsNeedingArticles(50);
      console.log(`   ✅ Got ${trends.length} trends from Firebase`);
      
      if (trends.length > 0) {
        console.log(`   📊 First 3 trends:`);
        trends.slice(0, 3).forEach((t, i) => {
          console.log(`      ${i + 1}. "${t.title}" - ${t.category} - searchVolume: ${t.searchVolume}`);
        });
      } else {
        console.log(`   ⚠️ No trends available!`);
        return NextResponse.json({
          success: false,
          error: 'No trends available from Firebase',
          step: 'fetch_trends'
        });
      }
      
      // Step 2: Try to create daily plan
      console.log('\n2️⃣ Creating daily plan...');
      const { automatedArticleGenerator } = await import('@/lib/services/automated-article-generator');
      
      // Force create new plan
      const generator = automatedArticleGenerator as any;
      const dailyPlan = await generator.createDailyPlan(today);
      
      console.log(`   ✅ Daily plan created with ${dailyPlan.jobs.length} jobs`);
      
      if (dailyPlan.jobs.length > 0) {
        console.log(`   📋 First 3 jobs:`);
        dailyPlan.jobs.slice(0, 3).forEach((job: any) => {
          console.log(`      #${job.position}: "${job.trend.title}" - ${job.status}`);
        });
      }
      
      return NextResponse.json({
        success: true,
        data: {
          date: dailyPlan.date,
          totalJobs: dailyPlan.jobs.length,
          trendsAvailable: trends.length,
          firstJobs: dailyPlan.jobs.slice(0, 5).map((job: any) => ({
            position: job.position,
            title: job.trend.title,
            status: job.status,
            scheduledAt: job.scheduledAt
          }))
        }
      });
      
    } catch (firebaseError) {
      console.error('❌ Firebase error:', firebaseError);
      return NextResponse.json({
        success: false,
        error: firebaseError instanceof Error ? firebaseError.message : 'Unknown Firebase error',
        stack: firebaseError instanceof Error ? firebaseError.stack : undefined,
        step: 'firebase_fetch'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Debug create plan error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

