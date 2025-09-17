import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Import services
    const { automationService } = await import('@/lib/services/automation');
    const { automatedArticleGenerator } = await import('@/lib/services/automated-article-generator');

    // Get current time
    const now = new Date();
    const timestamp = now.toISOString();

    // Get detailed stats
    const automationStats = automationService.getStats();
    const generatorStats = automatedArticleGenerator.getStats();

    // Check interval status
    const intervalStatus = {
      hasInterval: !!automatedArticleGenerator.intervalIdForDebug,
      intervalId: automatedArticleGenerator.intervalIdForDebug ? 'ACTIVE' : 'NONE',
      isRunning: generatorStats.isRunning
    };

    // Get daily plan info
    const today = now.toISOString().split('T')[0];
    const dailyPlan = automatedArticleGenerator.getDailyPlan(today);

    const dailyPlanInfo = dailyPlan ? {
      date: dailyPlan.date,
      totalJobs: dailyPlan.jobs.length,
      completed: dailyPlan.jobs.filter(j => j.status === 'completed').length,
      pending: dailyPlan.jobs.filter(j => j.status === 'pending').length,
      generating: dailyPlan.jobs.filter(j => j.status === 'generating').length,
      failed: dailyPlan.jobs.filter(j => j.status === 'failed').length,
      nextJob: dailyPlan.jobs.find(j => j.status === 'pending' && j.scheduledAt && new Date(j.scheduledAt) <= now)
    } : null;

    return NextResponse.json({
      success: true,
      timestamp,
      data: {
        automation: {
          ...automationStats,
          type: 'AutomationService'
        },
        generator: {
          ...generatorStats,
          type: 'AutomatedArticleGenerator'
        },
        interval: intervalStatus,
        dailyPlan: dailyPlanInfo,
        system: {
          currentTime: timestamp,
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage()
        }
      }
    });

  } catch (error) {
    console.error('❌ Monitor error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Monitor failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST /api/debug/monitor - Get live monitoring for X seconds
export async function POST(request: Request) {
  try {
    const { duration = 60 } = await request.json(); // Default 60 seconds
    
    console.log(`🔍 MONITOR: Starting ${duration}s monitoring session...`);
    
    const startTime = Date.now();
    const logs: any[] = [];
    
    // Monitor for the specified duration
    const monitorInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      
      // Import services dynamically
      import('@/lib/services/automated-article-generator').then(({ automatedArticleGenerator }) => {
        const stats = automatedArticleGenerator.getStats();
        const hasInterval = !!automatedArticleGenerator.intervalIdForDebug;
        
        logs.push({
          timestamp: new Date().toISOString(),
          elapsed: `${elapsed}s`,
          isRunning: stats.isRunning,
          hasInterval,
          pendingJobs: stats.pendingJobs,
          generatingJobs: stats.generatingJobs
        });
        
        console.log(`🔍 MONITOR [${elapsed}s]: Running=${stats.isRunning}, Interval=${hasInterval}, Pending=${stats.pendingJobs}, Generating=${stats.generatingJobs}`);
      });
      
      if (elapsed >= duration) {
        clearInterval(monitorInterval);
        console.log(`🔍 MONITOR: Session complete after ${duration}s`);
      }
    }, 5000); // Check every 5 seconds
    
    // Return immediately with session info
    return NextResponse.json({
      success: true,
      message: `Monitoring session started for ${duration} seconds`,
      sessionId: startTime,
      duration,
      checkInterval: 5,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Monitor session error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Monitor session failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
