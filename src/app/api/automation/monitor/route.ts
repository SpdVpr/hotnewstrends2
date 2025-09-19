import { NextRequest, NextResponse } from 'next/server';
import { automatedArticleGenerator } from '@/lib/services/automated-article-generator';

// GET /api/automation/monitor - Monitor service health and auto-restart if needed
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Monitoring article generation service...');

    // Get current stats
    const stats = await automatedArticleGenerator.getStats();
    const isActuallyRunning = automatedArticleGenerator.isActuallyRunning();
    
    // Check if auto-restart is needed
    const shouldAutoRestart = automatedArticleGenerator.checkAutoRestart();
    
    let autoRestartPerformed = false;
    let autoRestartReason = null;

    // Auto-restart if needed
    if (shouldAutoRestart && !isActuallyRunning) {
      console.log('🔄 Auto-restarting article generation service...');
      automatedArticleGenerator.start();
      autoRestartPerformed = true;
      autoRestartReason = 'Service was previously running but stopped unexpectedly';
    }

    // Get updated stats after potential restart
    const updatedStats = await automatedArticleGenerator.getStats();
    const finalRunningState = automatedArticleGenerator.isActuallyRunning();

    const monitoringData = {
      timestamp: new Date().toISOString(),
      service: {
        isRunning: finalRunningState,
        wasRunning: isActuallyRunning,
        shouldRestart: shouldAutoRestart,
        autoRestartPerformed,
        autoRestartReason
      },
      stats: updatedStats,
      health: {
        status: finalRunningState ? 'healthy' : 'stopped',
        uptime: finalRunningState ? 'running' : 'stopped',
        lastCheck: new Date().toISOString()
      }
    };

    console.log('📊 Service monitoring result:', {
      running: finalRunningState,
      autoRestart: autoRestartPerformed,
      reason: autoRestartReason
    });

    return NextResponse.json({
      success: true,
      data: monitoringData
    });

  } catch (error) {
    console.error('❌ Error in service monitoring:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST /api/automation/monitor - Force health check and restart if needed
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    console.log(`🔧 Manual monitoring action: ${action}`);

    let result: any = {
      timestamp: new Date().toISOString(),
      action,
      performed: false
    };

    switch (action) {
      case 'health_check':
        const stats = await automatedArticleGenerator.getStats();
        const isRunning = automatedArticleGenerator.isActuallyRunning();
        
        result = {
          ...result,
          performed: true,
          service: {
            isRunning,
            stats
          }
        };
        break;

      case 'force_restart':
        console.log('🔄 Force restarting service...');
        automatedArticleGenerator.restart();
        result = {
          ...result,
          performed: true,
          message: 'Service restart initiated'
        };
        break;

      case 'auto_restart_check':
        const shouldRestart = automatedArticleGenerator.checkAutoRestart();
        const currentlyRunning = automatedArticleGenerator.isActuallyRunning();
        
        if (shouldRestart && !currentlyRunning) {
          automatedArticleGenerator.start();
          result = {
            ...result,
            performed: true,
            message: 'Auto-restart performed',
            reason: 'Service should be running based on stored state'
          };
        } else {
          result = {
            ...result,
            performed: false,
            message: 'No auto-restart needed',
            currentState: {
              shouldRestart,
              currentlyRunning
            }
          };
        }
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}. Available actions: health_check, force_restart, auto_restart_check`
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Error in manual monitoring action:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
