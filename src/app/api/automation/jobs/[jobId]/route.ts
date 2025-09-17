import { NextRequest, NextResponse } from 'next/server';
import { automationService } from '@/lib/services/automation';

interface RouteParams {
  params: Promise<{
    jobId: string;
  }>;
}

// GET /api/automation/jobs/[jobId] - Get specific job status
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const job = automationService.getJobStatus(jobId);

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Transform job for API response
    const jobResponse = {
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
        content: job.article.content,
        author: job.article.author,
        publishedAt: job.article.publishedAt,
        readTime: job.article.readTime,
        tags: job.article.tags,
        seoTitle: job.article.seoTitle,
        seoDescription: job.article.seoDescription,
        image: job.article.image
      } : null
    };

    return NextResponse.json({
      success: true,
      data: jobResponse
    });

  } catch (error) {
    console.error('Error getting job status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get job status' 
      },
      { status: 500 }
    );
  }
}
