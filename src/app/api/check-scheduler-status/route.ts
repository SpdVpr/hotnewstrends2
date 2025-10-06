import { NextRequest, NextResponse } from 'next/server';

// GET /api/check-scheduler-status - Check scheduler configuration and status
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking scheduler status...');
    
    // Check environment variables
    const schedulerConfig = {
      nodeEnv: process.env.NODE_ENV,
      serpApiKey: process.env.SERPAPI_KEY ? 'SET' : 'NOT_SET',
      serpApiKeyPreview: process.env.SERPAPI_KEY ? 
        process.env.SERPAPI_KEY.substring(0, 10) + '...' : 'NOT_SET',
      firebaseConfig: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT_SET',
        hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      }
    };
    
    // Check if scheduler endpoints exist
    const schedulerEndpoints = [
      '/api/trends-scheduler',
      '/api/force-trends-update',
      '/api/debug-scheduler'
    ];
    
    const endpointStatus = {};
    for (const endpoint of schedulerEndpoints) {
      try {
        const response = await fetch(`https://www.hotnewstrends.com${endpoint}`, {
          method: 'GET',
          headers: { 'User-Agent': 'Scheduler-Status-Check' }
        });
        endpointStatus[endpoint] = {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        };
      } catch (error) {
        endpointStatus[endpoint] = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    // Check Vercel cron configuration
    const cronConfig = {
      expectedSchedule: '3x daily', // 3 times per day
      description: 'Should run trends-scheduler 3 times daily',
      nextRuns: [
        '08:00', '14:00', '20:00'
      ]
    };
    
    // Current time analysis
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    const nextScheduledHour = Math.ceil(currentHour / 4) * 4;
    const minutesUntilNext = ((nextScheduledHour - currentHour) * 60) - currentMinute;
    
    return NextResponse.json({
      success: true,
      data: {
        schedulerConfig,
        endpointStatus,
        cronConfig,
        currentTime: {
          utc: now.toISOString(),
          hour: currentHour,
          minute: currentMinute,
          nextScheduledHour: nextScheduledHour % 24,
          minutesUntilNextRun: minutesUntilNext > 0 ? minutesUntilNext : minutesUntilNext + 240
        },
        diagnostics: {
          hasRequiredConfig: schedulerConfig.serpApiKey === 'SET' && 
                           schedulerConfig.firebaseConfig.hasServiceAccount,
          endpointsAccessible: Object.values(endpointStatus).every(status => 
            'ok' in status && status.ok
          ),
          recommendations: [
            schedulerConfig.serpApiKey !== 'SET' ? 'Set SERPAPI_KEY environment variable' : null,
            !schedulerConfig.firebaseConfig.hasServiceAccount ? 'Set FIREBASE_SERVICE_ACCOUNT_KEY' : null,
            'Check Vercel cron job configuration',
            'Manually trigger /api/force-trends-update to test'
          ].filter(Boolean)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error checking scheduler status:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
