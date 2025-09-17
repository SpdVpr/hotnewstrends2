import { NextRequest, NextResponse } from 'next/server';
import { automationService } from '@/lib/services/automation';

// GET /api/automation - Get automation status and stats
export async function GET() {
  try {
    const stats = automationService.getStats();
    
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
        await automationService.start();
        return NextResponse.json({
          success: true,
          message: 'Automation service started'
        });

      case 'stop':
        automationService.stop();
        return NextResponse.json({
          success: true,
          message: 'Automation service stopped'
        });

      case 'updateConfig':
        if (!config) {
          return NextResponse.json(
            { success: false, error: 'Config is required' },
            { status: 400 }
          );
        }
        automationService.updateConfig(config);
        return NextResponse.json({
          success: true,
          message: 'Configuration updated',
          data: automationService.getConfig()
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
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
