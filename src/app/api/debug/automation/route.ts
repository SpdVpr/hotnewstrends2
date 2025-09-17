import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Import services
    const { automationService } = await import('@/lib/services/automation');
    const { automatedArticleGenerator } = await import('@/lib/services/automated-article-generator');

    // Get detailed stats
    const automationStats = automationService.getStats();
    const generatorStats = automatedArticleGenerator.getStats();

    // Check if there are any active intervals
    const processInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };

    return NextResponse.json({
      success: true,
      data: {
        automation: {
          ...automationStats,
          type: 'AutomationService'
        },
        generator: {
          ...generatorStats,
          type: 'AutomatedArticleGenerator',
          intervalId: automatedArticleGenerator.intervalIdForDebug ? 'ACTIVE' : 'NONE'
        },
        process: processInfo,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Debug automation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/debug/automation - Force stop everything
export async function POST() {
  try {
    console.log('🔧 DEBUG: Force stopping all automation...');

    // Import services
    const { automationService } = await import('@/lib/services/automation');
    const { automatedArticleGenerator } = await import('@/lib/services/automated-article-generator');

    // Force stop automation service
    automationService.stop();
    console.log('🛑 DEBUG: Automation service stopped');

    // Force stop automated article generator
    automatedArticleGenerator.stop();
    console.log('🛑 DEBUG: Automated article generator stopped');

    // Clear any remaining intervals (brute force)
    if (automatedArticleGenerator.intervalIdForDebug) {
      clearInterval(automatedArticleGenerator.intervalIdForDebug);
      console.log('🛑 DEBUG: Cleared interval manually');
    }

    // Get final stats
    const finalStats = {
      automation: automationService.getStats(),
      generator: automatedArticleGenerator.getStats()
    };

    return NextResponse.json({
      success: true,
      message: 'DEBUG: All automation force stopped',
      data: finalStats
    });

  } catch (error) {
    console.error('❌ Debug force stop error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Debug force stop failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
