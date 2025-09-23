import { NextRequest, NextResponse } from 'next/server';
import { xAutoShareService } from '@/lib/services/x-auto-share';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing X API connection...');
    
    const testResult = await xAutoShareService.testConnection();
    
    if (testResult.success) {
      return NextResponse.json({
        success: true,
        message: 'X API connection successful',
        user: testResult.user
      });
    } else {
      return NextResponse.json({
        success: false,
        error: testResult.error
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('X API test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
