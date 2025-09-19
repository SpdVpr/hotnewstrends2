import { NextRequest, NextResponse } from 'next/server';
import { automatedArticleGenerator } from '@/lib/services/automated-article-generator';

// GET /api/automation/status - Get detailed status including production mode
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Getting detailed automation status...');
    
    // Get environment info
    const isProduction = process.env.NODE_ENV === 'production' && process.env.VERCEL;
    const nodeEnv = process.env.NODE_ENV;
    const isVercel = !!process.env.VERCEL;
    
    // Get service stats
    const stats = await automatedArticleGenerator.getStats();
    const isActuallyRunning = automatedArticleGenerator.isActuallyRunning();
    const intervalId = automatedArticleGenerator.intervalIdForDebug;
    
    // Get stored state from localStorage (if available)
    let storedState = null;
    try {
      if (typeof window !== 'undefined') {
        storedState = {
          status: localStorage.getItem('article_generator_status'),
          startTime: localStorage.getItem('article_generator_start_time'),
          lastActivity: localStorage.getItem('article_generator_last_activity'),
          stopTime: localStorage.getItem('article_generator_stop_time')
        };
      }
    } catch (error) {
      console.warn('Could not read localStorage:', error);
    }

    const detailedStatus = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv,
        isVercel,
        isProduction,
        mode: isProduction ? 'cron-based' : 'interval-based'
      },
      service: {
        isRunning: automatedArticleGenerator.isRunning,
        isActuallyRunning,
        hasInterval: !!intervalId,
        intervalId: intervalId ? 'active' : 'none'
      },
      stats,
      storedState,
      explanation: {
        productionMode: isProduction 
          ? 'Using Vercel cron jobs - no interval needed'
          : 'Using local intervals - interval required',
        statusLogic: isProduction
          ? 'isActuallyRunning = isRunning (cron-based)'
          : 'isActuallyRunning = isRunning && hasInterval (interval-based)'
      }
    };

    console.log('📊 Detailed status:', {
      isProduction,
      isRunning: automatedArticleGenerator.isRunning,
      isActuallyRunning,
      hasInterval: !!intervalId
    });

    return NextResponse.json({
      success: true,
      data: detailedStatus
    });

  } catch (error) {
    console.error('❌ Error getting automation status:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
