import { NextRequest, NextResponse } from 'next/server';
import { ErrorEvent } from '@/lib/error-monitoring';

// In-memory storage for errors (in production, use a database)
const errors: ErrorEvent[] = [];
const MAX_ERRORS = 10000; // Keep only the latest 10,000 errors

// POST /api/errors - Receive error reports from client
export async function POST(request: NextRequest) {
  try {
    const errorData: ErrorEvent = await request.json();
    
    // Validate error data
    if (!errorData.message || !errorData.timestamp) {
      return NextResponse.json(
        { success: false, error: 'Invalid error data' },
        { status: 400 }
      );
    }

    // Add server-side metadata
    const enrichedError: ErrorEvent = {
      ...errorData,
      timestamp: new Date(errorData.timestamp),
      context: {
        ...errorData.context,
        serverTimestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'unknown',
        referer: request.headers.get('referer') || undefined
      }
    };

    // Store error
    errors.push(enrichedError);

    // Keep only the latest errors
    if (errors.length > MAX_ERRORS) {
      errors.splice(0, errors.length - MAX_ERRORS);
    }

    // Log critical errors
    if (enrichedError.severity === 'critical') {
      console.error('🚨 CRITICAL ERROR:', enrichedError);
      
      // In production, you might want to:
      // - Send alerts to Slack/Discord
      // - Send emails to developers
      // - Create tickets in issue tracking system
      await handleCriticalError(enrichedError);
    }

    // Log high severity errors
    if (enrichedError.severity === 'high') {
      console.warn('⚠️ HIGH SEVERITY ERROR:', enrichedError);
    }

    return NextResponse.json({
      success: true,
      message: 'Error logged successfully',
      errorId: enrichedError.id
    });

  } catch (error) {
    console.error('Error processing error report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}

// GET /api/errors - Get error analytics and reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const category = searchParams.get('category');
    const resolved = searchParams.get('resolved');
    const limit = parseInt(searchParams.get('limit') || '100');
    const timeframe = searchParams.get('timeframe') || '24h';

    // Calculate time threshold
    const now = Date.now();
    const timeThresholds = {
      '1h': now - (60 * 60 * 1000),
      '24h': now - (24 * 60 * 60 * 1000),
      '7d': now - (7 * 24 * 60 * 60 * 1000),
      '30d': now - (30 * 24 * 60 * 60 * 1000)
    };

    const threshold = timeThresholds[timeframe as keyof typeof timeThresholds] || timeThresholds['24h'];

    // Filter errors
    let filteredErrors = errors.filter(error => error.timestamp.getTime() >= threshold);

    if (severity) {
      filteredErrors = filteredErrors.filter(error => error.severity === severity);
    }

    if (category) {
      filteredErrors = filteredErrors.filter(error => error.category === category);
    }

    if (resolved !== null) {
      const isResolved = resolved === 'true';
      filteredErrors = filteredErrors.filter(error => error.resolved === isResolved);
    }

    // Sort by timestamp (newest first)
    filteredErrors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Limit results
    const limitedErrors = filteredErrors.slice(0, limit);

    // Calculate statistics
    const stats = calculateErrorStats(filteredErrors);

    return NextResponse.json({
      success: true,
      data: {
        errors: limitedErrors,
        stats,
        timeframe,
        totalCount: filteredErrors.length,
        filters: { severity, category, resolved, limit }
      }
    });

  } catch (error) {
    console.error('Error fetching error analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch error analytics' },
      { status: 500 }
    );
  }
}

// PUT /api/errors/:id - Update error status (resolve/unresolve)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const errorId = searchParams.get('id');
    const { resolved } = await request.json();

    if (!errorId) {
      return NextResponse.json(
        { success: false, error: 'Error ID is required' },
        { status: 400 }
      );
    }

    const errorIndex = errors.findIndex(error => error.id === errorId);
    
    if (errorIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Error not found' },
        { status: 404 }
      );
    }

    errors[errorIndex].resolved = resolved;

    return NextResponse.json({
      success: true,
      message: `Error ${resolved ? 'resolved' : 'reopened'} successfully`,
      error: errors[errorIndex]
    });

  } catch (error) {
    console.error('Error updating error status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update error status' },
      { status: 500 }
    );
  }
}

// Helper function to calculate error statistics
function calculateErrorStats(errors: ErrorEvent[]) {
  const stats = {
    total: errors.length,
    bySeverity: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
    byPage: {} as Record<string, number>,
    byBrowser: {} as Record<string, number>,
    resolved: 0,
    unresolved: 0,
    topErrors: [] as Array<{ message: string; count: number; lastSeen: Date }>,
    errorRate: 0,
    trends: {
      last24h: 0,
      last7d: 0,
      last30d: 0
    }
  };

  const now = Date.now();
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

  // Group errors by message for top errors
  const errorGroups: Record<string, { count: number; lastSeen: Date }> = {};

  errors.forEach(error => {
    // Count by severity
    stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;

    // Count by category
    stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;

    // Count by page
    try {
      const url = new URL(error.url);
      const page = url.pathname;
      stats.byPage[page] = (stats.byPage[page] || 0) + 1;
    } catch (e) {
      stats.byPage['unknown'] = (stats.byPage['unknown'] || 0) + 1;
    }

    // Count by browser
    const browser = extractBrowser(error.userAgent);
    stats.byBrowser[browser] = (stats.byBrowser[browser] || 0) + 1;

    // Count resolved/unresolved
    if (error.resolved) {
      stats.resolved++;
    } else {
      stats.unresolved++;
    }

    // Group by message
    if (!errorGroups[error.message]) {
      errorGroups[error.message] = { count: 0, lastSeen: error.timestamp };
    }
    errorGroups[error.message].count++;
    if (error.timestamp > errorGroups[error.message].lastSeen) {
      errorGroups[error.message].lastSeen = error.timestamp;
    }

    // Count trends
    const errorTime = error.timestamp.getTime();
    if (errorTime >= oneDayAgo) stats.trends.last24h++;
    if (errorTime >= oneWeekAgo) stats.trends.last7d++;
    if (errorTime >= oneMonthAgo) stats.trends.last30d++;
  });

  // Calculate top errors
  stats.topErrors = Object.entries(errorGroups)
    .map(([message, data]) => ({ message, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Calculate error rate (errors per hour in last 24h)
  stats.errorRate = stats.trends.last24h / 24;

  return stats;
}

// Helper function to extract browser from user agent
function extractBrowser(userAgent: string): string {
  if (!userAgent) return 'unknown';
  
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  
  return 'other';
}

// Handle critical errors (notifications, alerts, etc.)
async function handleCriticalError(error: ErrorEvent) {
  try {
    // In production, implement:
    // 1. Send Slack/Discord notifications
    // 2. Send email alerts to developers
    // 3. Create tickets in issue tracking system
    // 4. Log to external monitoring services (Sentry, LogRocket, etc.)
    
    console.log('🚨 Handling critical error:', {
      id: error.id,
      message: error.message,
      url: error.url,
      timestamp: error.timestamp,
      context: error.context
    });

    // Mock notification - in production, replace with actual notification service
    if (process.env.SLACK_WEBHOOK_URL) {
      // await sendSlackNotification(error);
    }

    if (process.env.EMAIL_SERVICE_API_KEY) {
      // await sendEmailAlert(error);
    }

  } catch (notificationError) {
    console.error('Failed to handle critical error notifications:', notificationError);
  }
}
