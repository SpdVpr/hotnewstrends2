import { NextRequest, NextResponse } from 'next/server';

// GET /api/test-serpapi - Test SerpAPI connection and data
export async function GET(request: NextRequest) {
  try {
    const serpApiKey = process.env.SERPAPI_KEY;
    
    if (!serpApiKey) {
      return NextResponse.json({
        success: false,
        error: 'SERPAPI_KEY not found in environment variables',
        hasKey: false
      });
    }

    console.log('🔑 SerpAPI Key found:', serpApiKey ? `${serpApiKey.substring(0, 10)}...` : 'NO KEY');

    // SerpAPI test disabled to conserve quota
    console.log('🚫 SerpAPI test disabled to conserve quota');

    return NextResponse.json({
      success: false,
      hasKey: true,
      keyPreview: `${serpApiKey.substring(0, 10)}...`,
      message: 'SerpAPI test is disabled to conserve quota. Only scheduled updates are allowed.',
      error: 'Test endpoint disabled'
    });

  } catch (error) {
    console.error('❌ SerpAPI Test Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasKey: !!process.env.SERPAPI_KEY
    }, { status: 500 });
  }
}
