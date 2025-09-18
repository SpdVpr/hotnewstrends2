import { NextRequest, NextResponse } from 'next/server';

// GET /api/check-analytics - Check Google Analytics configuration
export async function GET(request: NextRequest) {
  try {
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    const firebaseMeasurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
    const nodeEnv = process.env.NODE_ENV;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    
    return NextResponse.json({
      success: true,
      analytics: {
        gaId: gaId || 'NOT_SET',
        firebaseMeasurementId: firebaseMeasurementId || 'NOT_SET',
        isConfigured: !!gaId,
        isProduction: nodeEnv === 'production',
        siteUrl: siteUrl || 'NOT_SET',
        environment: nodeEnv || 'unknown'
      },
      recommendations: {
        shouldSetGaId: !gaId,
        shouldMatchFirebase: gaId !== firebaseMeasurementId,
        correctId: 'G-29LL0RMMRY'
      },
      status: {
        ready: !!gaId && gaId === 'G-29LL0RMMRY',
        message: !gaId 
          ? 'Google Analytics not configured - set NEXT_PUBLIC_GA_ID=G-29LL0RMMRY'
          : gaId !== 'G-29LL0RMMRY'
          ? `Google Analytics ID mismatch - should be G-29LL0RMMRY, got ${gaId}`
          : 'Google Analytics properly configured'
      }
    });

  } catch (error) {
    console.error('❌ Error checking analytics configuration:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
