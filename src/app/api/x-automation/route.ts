import { NextRequest, NextResponse } from 'next/server';
import { xAutomationService } from '@/lib/services/x-automation';

export async function GET(request: NextRequest) {
  try {
    const stats = await xAutomationService.getStats();
    const config = xAutomationService.getConfig();
    const timeUntilNext = xAutomationService.getTimeUntilNextShare();
    const optimalTimes = xAutomationService.getOptimalSharingTimes();
    
    return NextResponse.json({
      success: true,
      data: {
        stats,
        config,
        timeUntilNext,
        optimalTimes
      }
    });

  } catch (error: any) {
    console.error('X automation GET error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;

    switch (action) {
      case 'start':
        await xAutomationService.start();
        return NextResponse.json({
          success: true,
          message: 'X automation started'
        });

      case 'stop':
        xAutomationService.stop();
        return NextResponse.json({
          success: true,
          message: 'X automation stopped'
        });

      case 'restart':
        xAutomationService.stop();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await xAutomationService.start();
        return NextResponse.json({
          success: true,
          message: 'X automation restarted'
        });

      case 'force-share':
        const result = await xAutomationService.forceShare();
        return NextResponse.json({
          success: true,
          message: `Force shared ${result.articlesShared} articles`,
          data: result
        });

      case 'test-connection':
        const testResult = await xAutomationService.testConnection();
        return NextResponse.json({
          success: testResult.success,
          message: testResult.success ? 'Connection successful' : 'Connection failed',
          data: testResult
        });

      case 'update-config':
        if (config) {
          xAutomationService.updateConfig(config);
          return NextResponse.json({
            success: true,
            message: 'Configuration updated'
          });
        } else {
          return NextResponse.json({
            success: false,
            error: 'Config data required'
          }, { status: 400 });
        }

      case 'get-stats':
        const stats = await xAutomationService.getStats();
        return NextResponse.json({
          success: true,
          data: stats
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('X automation POST error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
