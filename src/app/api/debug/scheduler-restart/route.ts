import { NextRequest, NextResponse } from 'next/server';

// POST /api/debug/scheduler-restart - Restart trends scheduler
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Restarting trends scheduler...');
    
    // Import scheduler
    const { trendsScheduler } = await import('@/lib/services/trends-scheduler');
    
    // Stop current scheduler
    trendsScheduler.stop();
    console.log('⏹️ Scheduler stopped');
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Start scheduler again
    trendsScheduler.start();
    console.log('▶️ Scheduler restarted');
    
    // Get current status
    const status = trendsScheduler.getStats();
    
    return NextResponse.json({
      success: true,
      message: 'Trends scheduler restarted successfully',
      status: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error restarting scheduler:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET /api/debug/scheduler-restart - Get scheduler status
export async function GET(request: NextRequest) {
  try {
    const { trendsScheduler } = await import('@/lib/services/trends-scheduler');
    const status = trendsScheduler.getStats();
    
    return NextResponse.json({
      success: true,
      status: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting scheduler status:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
