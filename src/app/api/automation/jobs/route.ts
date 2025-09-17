import { NextRequest, NextResponse } from 'next/server';
import { automationService } from '@/lib/services/automation';

// GET /api/automation/jobs - Get all automation jobs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let jobs = automationService.getAllJobs();

    // Filter by status if provided
    if (status && ['pending', 'generating', 'completed', 'failed'].includes(status)) {
      jobs = jobs.filter(job => job.status === status);
    }

    // Limit results
    jobs = jobs.slice(0, limit);

    // Transform jobs for API response
    const jobsResponse = jobs.map(job => ({
      id: job.id,
      topic: job.topic.keyword,
      category: job.topic.category,
      status: job.status,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      error: job.error,
      article: job.article ? {
        id: job.article.id,
        title: job.article.title,
        slug: job.article.slug,
        excerpt: job.article.excerpt,
        publishedAt: job.article.publishedAt
      } : null
    }));

    return NextResponse.json({
      success: true,
      data: {
        jobs: jobsResponse,
        total: jobs.length,
        stats: {
          pending: jobs.filter(j => j.status === 'pending').length,
          generating: jobs.filter(j => j.status === 'generating').length,
          completed: jobs.filter(j => j.status === 'completed').length,
          failed: jobs.filter(j => j.status === 'failed').length
        }
      }
    });

  } catch (error) {
    console.error('Error getting automation jobs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get automation jobs' 
      },
      { status: 500 }
    );
  }
}
