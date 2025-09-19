import { NextResponse } from 'next/server';
import { firebaseTrendsService } from '@/lib/services/firebase-trends';
import { automatedArticleGenerator } from '@/lib/services/automated-article-generator';

// POST /api/start-generation - Start article generation with Firebase trends
export async function POST() {
  try {
    console.log('🚀 Starting article generation with Firebase trends...');
    
    // Step 1: Get trends from Firebase
    const trends = await firebaseTrendsService.getTrendsNeedingArticles(24);
    console.log(`📊 Found ${trends.length} trends needing articles`);
    
    if (trends.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No trends available for article generation'
      });
    }
    
    // Step 2: Create daily plan manually
    const today = new Date().toISOString().split('T')[0];
    const jobs = [];
    
    // Create jobs for each trend
    for (let i = 0; i < Math.min(24, trends.length); i++) {
      const trend = trends[i];

      // Schedule articles every hour starting from current hour
      const now = new Date();
      const currentHour = now.getHours();
      const scheduledHour = (currentHour + i) % 24; // Start from current hour, wrap around at 24
      const scheduledTime = new Date();
      scheduledTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
      scheduledTime.setHours(scheduledHour, 0, 0, 0); // Set to exact hour

      // If the scheduled time is in the past (for today), schedule for tomorrow
      if (scheduledTime.getTime() <= now.getTime()) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      const job = {
        id: `job_${today}_${i + 1}_${trend.title.replace(/[^a-zA-Z0-9]/g, '_')}`,
        trendId: trend.id,
        trend: {
          id: trend.id,
          title: trend.title,
          slug: trend.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          category: trend.category || 'general',
          formattedTraffic: trend.formattedTraffic,
          traffic: trend.searchVolume || 0,
          source: trend.source,
          firstSeen: trend.savedAt,
          lastSeen: trend.savedAt,
          articleGenerated: trend.articleGenerated,
          hash: trend.id
        },
        status: 'pending',
        position: i + 1,
        createdAt: new Date().toISOString(),
        scheduledAt: scheduledTime.toISOString()
      };
      
      jobs.push(job);
      
      if (i < 3) {
        console.log(`📅 Job ${i + 1}: "${trend.title}" scheduled for ${scheduledTime.toLocaleString()}`);
      }
    }
    
    // Step 3: Store daily plan
    const dailyPlan = {
      date: today,
      jobs,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Use reflection to access private method
    const generator = automatedArticleGenerator as any;
    generator.storeDailyPlan(dailyPlan);
    
    console.log(`✅ Created daily plan with ${jobs.length} jobs`);
    
    // Step 4: Start automation
    await automatedArticleGenerator.start();
    console.log('🚀 Article generation started');
    
    return NextResponse.json({
      success: true,
      message: `Article generation started with ${jobs.length} jobs`,
      data: {
        totalJobs: jobs.length,
        firstJob: jobs[0]?.trend.title,
        nextJobAt: jobs[0]?.scheduledAt
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start article generation:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to start article generation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
