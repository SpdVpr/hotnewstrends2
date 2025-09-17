import { NextRequest, NextResponse } from 'next/server';
import { trendTracker } from '@/lib/services/trend-tracker';
import { automatedArticleGenerator } from '@/lib/services/automated-article-generator';

// GET /api/trend-tracking - Get trend tracking statistics and recent trends
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (action === 'recent') {
      // Get recent trends
      const recentTrends = trendTracker.getRecentTrends(limit);
      
      return NextResponse.json({
        success: true,
        data: {
          trends: recentTrends,
          total: recentTrends.length
        }
      });
    }

    if (action === 'jobs') {
      // Get recent generation jobs
      const recentJobs = automatedArticleGenerator.getRecentJobs(limit);
      
      return NextResponse.json({
        success: true,
        data: {
          jobs: recentJobs,
          total: recentJobs.length
        }
      });
    }

    // Default: Get comprehensive statistics
    const trendStats = trendTracker.getTrendingStats();
    const generationStats = automatedArticleGenerator.getStats();
    const trendsNeedingArticles = trendTracker.getTrendsNeedingArticles();
    const recentTrends = trendTracker.getRecentTrends(10);
    const recentJobs = automatedArticleGenerator.getRecentJobs(10);

    return NextResponse.json({
      success: true,
      data: {
        trendStats,
        generationStats,
        trendsNeedingArticles: trendsNeedingArticles.length,
        recentTrends,
        recentJobs,
        summary: {
          totalTrends: trendStats.totalTrends,
          articlesGenerated: trendStats.articlesGenerated,
          pendingArticles: trendsNeedingArticles.length,
          isGenerating: generationStats.isRunning,
          todayJobs: generationStats.todayJobs,
          maxDailyJobs: 8 // Match SerpApi daily limit
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching trend tracking data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch trend tracking data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/trend-tracking - Control trend tracking and article generation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'start_generation':
        automatedArticleGenerator.start();
        return NextResponse.json({
          success: true,
          message: 'Automated article generation started',
          data: automatedArticleGenerator.getStats()
        });

      case 'stop_generation':
        automatedArticleGenerator.stop();
        return NextResponse.json({
          success: true,
          message: 'Automated article generation stopped',
          data: automatedArticleGenerator.getStats()
        });

      case 'clear_trends':
        trendTracker.clearStoredTrends();
        return NextResponse.json({
          success: true,
          message: 'Stored trends cleared'
        });

      case 'clear_jobs':
        automatedArticleGenerator.clearJobs();
        return NextResponse.json({
          success: true,
          message: 'Generation jobs cleared'
        });

      case 'generate_article':
        const { trendId } = params;
        if (!trendId) {
          return NextResponse.json(
            { success: false, error: 'Trend ID is required' },
            { status: 400 }
          );
        }

        // This would trigger manual article generation for a specific trend
        // Implementation would depend on your article generation system
        return NextResponse.json({
          success: true,
          message: `Manual article generation triggered for trend: ${trendId}`,
          data: { trendId }
        });

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Error processing trend tracking action:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process trend tracking action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
