import { NextRequest, NextResponse } from 'next/server';
import { automatedArticleGenerator } from '@/lib/services/automated-article-generator';

// GET /api/automation - Get automation status and stats
export async function GET() {
  try {
    const stats = await automatedArticleGenerator.getStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting automation stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get automation stats' 
      },
      { status: 500 }
    );
  }
}

// POST /api/automation - Control automation service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;

    switch (action) {
      case 'start':
        console.log('🚀 Starting automated article generator...');
        await automatedArticleGenerator.start();
        return NextResponse.json({
          success: true,
          message: 'Automated article generator started'
        });

      case 'stop':
        console.log('🛑 Stopping automated article generator...');
        automatedArticleGenerator.stop();
        return NextResponse.json({
          success: true,
          message: 'Automated article generator stopped'
        });

      case 'force_stop':
        console.log('🛑 FORCE STOP: Stopping automated article generator...');
        automatedArticleGenerator.stop();
        return NextResponse.json({
          success: true,
          message: 'FORCE STOP: Automated article generator stopped'
        });

      case 'restart':
        console.log('🔄 Restarting automated article generator...');
        automatedArticleGenerator.restart();
        return NextResponse.json({
          success: true,
          message: 'Automated article generator restarted'
        });

      case 'health_check':
        const isActuallyRunning = automatedArticleGenerator.isActuallyRunning();
        const stats = await automatedArticleGenerator.getStats();

        return NextResponse.json({
          success: true,
          data: {
            isActuallyRunning,
            stats,
            hasInterval: !!automatedArticleGenerator.intervalIdForDebug,
            intervalId: automatedArticleGenerator.intervalIdForDebug ? 'ACTIVE' : 'NONE'
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Available: start, stop, force_stop, restart, health_check' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error controlling automation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to control automation service' 
      },
      { status: 500 }
    );
  }
}
