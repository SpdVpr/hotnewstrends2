import { NextRequest, NextResponse } from 'next/server';
import { xAutoShareService } from '@/lib/services/x-auto-share';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check here
    // const authHeader = request.headers.get('authorization');
    // if (!authHeader || authHeader !== `Bearer ${process.env.API_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log('Starting X auto-share process...');
    
    const result = await xAutoShareService.shareArticles();
    
    return NextResponse.json({
      success: result.success,
      message: `Shared ${result.articlesShared} articles`,
      articlesShared: result.articlesShared,
      errors: result.errors,
      rateLimitHit: result.rateLimitHit
    });

  } catch (error: any) {
    console.error('X share API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const stats = await xAutoShareService.getShareStats();
    
    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error: any) {
    console.error('X share stats API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
