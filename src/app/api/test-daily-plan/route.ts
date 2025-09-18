import { NextResponse } from 'next/server';
import { automatedArticleGenerator } from '@/lib/services/automated-article-generator';
import { firebaseTrendsService } from '@/lib/services/firebase-trends';

// GET /api/test-daily-plan - Test daily plan creation step by step
export async function GET() {
  try {
    console.log('🧪 Starting daily plan test...');
    
    // Step 1: Test Firebase trends service
    console.log('\n1. Testing Firebase trends service...');
    const trends = await firebaseTrendsService.getTrendsNeedingArticles(10);
    console.log(`📊 Retrieved ${trends.length} trends from Firebase`);
    
    if (trends.length > 0) {
      console.log('📊 Sample trends:');
      trends.slice(0, 3).forEach((trend, i) => {
        console.log(`  ${i + 1}. "${trend.title}" - ${trend.category} - ${trend.searchVolume}`);
      });
    }
    
    // Step 2: Test daily plan creation
    console.log('\n2. Testing daily plan creation...');
    const today = new Date().toISOString().split('T')[0];
    console.log(`Creating daily plan for: ${today}`);
    
    // Call refreshDailyPlan
    await automatedArticleGenerator.refreshDailyPlan();
    console.log('✅ Daily plan refresh completed');
    
    // Step 3: Check results
    console.log('\n3. Checking daily plan results...');
    const stats = automatedArticleGenerator.getStats();
    console.log('📊 Final stats:', {
      totalJobs: stats.totalJobs,
      pendingJobs: stats.pendingJobs,
      isRunning: stats.isRunning
    });
    
    return NextResponse.json({
      success: true,
      data: {
        trendsFound: trends.length,
        sampleTrends: trends.slice(0, 3).map(t => ({
          title: t.title,
          category: t.category,
          searchVolume: t.searchVolume
        })),
        finalStats: {
          totalJobs: stats.totalJobs,
          pendingJobs: stats.pendingJobs,
          isRunning: stats.isRunning
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Daily plan test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Daily plan test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
