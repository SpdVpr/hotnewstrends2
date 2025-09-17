import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userAgent?: string;
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  sessionId: string;
  timestamp: number;
}

// In-memory storage for performance metrics (in production, use a database)
const performanceMetrics: PerformanceMetric[] = [];
const MAX_METRICS = 1000; // Keep only the latest 1000 metrics

// POST /api/performance - Receive performance metrics from client
export async function POST(request: NextRequest) {
  try {
    const body: PerformanceReport = await request.json();
    
    if (!body.metrics || !Array.isArray(body.metrics)) {
      return NextResponse.json(
        { success: false, error: 'Invalid metrics data' },
        { status: 400 }
      );
    }

    // Process and store metrics
    const processedMetrics = body.metrics.map(metric => ({
      ...metric,
      timestamp: Date.now(),
      url: request.headers.get('referer') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    }));

    // Add to in-memory storage
    performanceMetrics.push(...processedMetrics);

    // Keep only the latest metrics
    if (performanceMetrics.length > MAX_METRICS) {
      performanceMetrics.splice(0, performanceMetrics.length - MAX_METRICS);
    }

    // Log poor performance metrics
    const poorMetrics = processedMetrics.filter(m => m.rating === 'poor');
    if (poorMetrics.length > 0) {
      console.warn('⚠️ Poor performance metrics detected:', poorMetrics);
    }

    return NextResponse.json({
      success: true,
      message: 'Performance metrics recorded',
      processed: processedMetrics.length
    });

  } catch (error) {
    console.error('Error processing performance metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process performance metrics' },
      { status: 500 }
    );
  }
}

// GET /api/performance - Get performance analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '24h';
    const metric = searchParams.get('metric'); // Filter by specific metric
    const url = searchParams.get('url'); // Filter by URL

    // Calculate time threshold
    const now = Date.now();
    const timeThresholds = {
      '1h': now - (60 * 60 * 1000),
      '24h': now - (24 * 60 * 60 * 1000),
      '7d': now - (7 * 24 * 60 * 60 * 1000),
      '30d': now - (30 * 24 * 60 * 60 * 1000)
    };

    const threshold = timeThresholds[timeframe as keyof typeof timeThresholds] || timeThresholds['24h'];

    // Filter metrics
    let filteredMetrics = performanceMetrics.filter(m => m.timestamp >= threshold);
    
    if (metric) {
      filteredMetrics = filteredMetrics.filter(m => m.name === metric);
    }
    
    if (url) {
      filteredMetrics = filteredMetrics.filter(m => m.url.includes(url));
    }

    // Calculate statistics
    const stats = calculatePerformanceStats(filteredMetrics);

    return NextResponse.json({
      success: true,
      data: {
        timeframe,
        totalMetrics: filteredMetrics.length,
        stats,
        recentMetrics: filteredMetrics.slice(-50), // Last 50 metrics
        summary: generatePerformanceSummary(stats)
      }
    });

  } catch (error) {
    console.error('Error getting performance analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get performance analytics' },
      { status: 500 }
    );
  }
}

function calculatePerformanceStats(metrics: PerformanceMetric[]) {
  const statsByMetric: Record<string, {
    count: number;
    average: number;
    median: number;
    p75: number;
    p95: number;
    good: number;
    needsImprovement: number;
    poor: number;
  }> = {};

  // Group metrics by name
  const groupedMetrics = metrics.reduce((acc, metric) => {
    if (!acc[metric.name]) acc[metric.name] = [];
    acc[metric.name].push(metric);
    return acc;
  }, {} as Record<string, PerformanceMetric[]>);

  // Calculate stats for each metric type
  Object.entries(groupedMetrics).forEach(([name, metricList]) => {
    const values = metricList.map(m => m.value).sort((a, b) => a - b);
    const ratings = metricList.reduce((acc, m) => {
      acc[m.rating]++;
      return acc;
    }, { good: 0, 'needs-improvement': 0, poor: 0 });

    statsByMetric[name] = {
      count: values.length,
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      median: values[Math.floor(values.length / 2)],
      p75: values[Math.floor(values.length * 0.75)],
      p95: values[Math.floor(values.length * 0.95)],
      good: ratings.good,
      needsImprovement: ratings['needs-improvement'],
      poor: ratings.poor
    };
  });

  return statsByMetric;
}

function generatePerformanceSummary(stats: Record<string, any>) {
  const coreWebVitals = ['CLS', 'FID', 'LCP'];
  const summary = {
    overallScore: 0,
    coreWebVitalsScore: 0,
    issues: [] as string[],
    recommendations: [] as string[]
  };

  let totalGood = 0;
  let totalMetrics = 0;
  let coreVitalsGood = 0;
  let coreVitalsTotal = 0;

  Object.entries(stats).forEach(([metric, data]) => {
    const goodPercentage = (data.good / data.count) * 100;
    totalGood += data.good;
    totalMetrics += data.count;

    if (coreWebVitals.includes(metric)) {
      coreVitalsGood += data.good;
      coreVitalsTotal += data.count;
    }

    // Generate issues and recommendations
    if (goodPercentage < 75) {
      summary.issues.push(`${metric} needs improvement (${goodPercentage.toFixed(1)}% good)`);
      
      if (metric === 'LCP' && data.average > 2500) {
        summary.recommendations.push('Optimize images and reduce server response time to improve LCP');
      }
      if (metric === 'FID' && data.average > 100) {
        summary.recommendations.push('Reduce JavaScript execution time to improve FID');
      }
      if (metric === 'CLS' && data.average > 0.1) {
        summary.recommendations.push('Ensure proper image dimensions and avoid layout shifts to improve CLS');
      }
    }
  });

  summary.overallScore = totalMetrics > 0 ? (totalGood / totalMetrics) * 100 : 0;
  summary.coreWebVitalsScore = coreVitalsTotal > 0 ? (coreVitalsGood / coreVitalsTotal) * 100 : 0;

  return summary;
}
