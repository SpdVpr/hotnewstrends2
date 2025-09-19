import { NextRequest, NextResponse } from 'next/server';
import { serpApiLogger } from '@/lib/utils/serpapi-logger';

// GET /api/serpapi-logs - Get SerpAPI usage logs and statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const format = searchParams.get('format') || 'json'; // 'json' or 'report'

    if (format === 'report') {
      // Return detailed text report
      const report = serpApiLogger.getDetailedReport();
      
      return NextResponse.json({
        success: true,
        data: {
          report,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Return structured data
    const recentLogs = serpApiLogger.getRecentLogs(limit);
    const todayLogs = serpApiLogger.getTodayLogs();
    const stats = serpApiLogger.getUsageStats();

    return NextResponse.json({
      success: true,
      data: {
        stats,
        recentLogs,
        todayLogs,
        summary: {
          totalLogsStored: recentLogs.length,
          todayCallsCount: todayLogs.length,
          recentSuccessRate: stats.recent.total > 0 
            ? Math.round(stats.recent.successful / stats.recent.total * 100) 
            : 0,
          averageResponseTime: stats.recent.averageResponseTime
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching SerpAPI logs:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/serpapi-logs - Clear old logs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'clear_old') {
      serpApiLogger.clearOldLogs();
      
      return NextResponse.json({
        success: true,
        message: 'Old SerpAPI logs cleared successfully'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use "clear_old" to clear old logs.'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Error managing SerpAPI logs:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
