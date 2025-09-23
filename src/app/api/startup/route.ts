import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Server-side startup initialization...');

    // Dynamic import to avoid client-side issues
    const { startupService } = await import('@/lib/startup');
    
    await startupService.initialize();
    
    return NextResponse.json({
      success: true,
      message: 'Server-side services initialized successfully'
    });

  } catch (error: any) {
    console.error('❌ Server startup failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Server startup failed'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { startupService } = await import('@/lib/startup');
    
    return NextResponse.json({
      success: true,
      initialized: startupService.isInitialized()
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to check startup status'
    }, { status: 500 });
  }
}
