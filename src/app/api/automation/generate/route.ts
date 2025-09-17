import { NextRequest, NextResponse } from 'next/server';
import { automationService } from '@/lib/services/automation';

// POST /api/automation/generate - Manually generate an article
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, category } = body;

    if (!topic) {
      return NextResponse.json(
        {
          success: false,
          error: 'Topic is required'
        },
        { status: 400 }
      );
    }

    // Category is now optional - AI will determine it
    const finalCategory = category || 'general'; // Fallback category

    console.log(`🚀 Manual article generation requested: ${topic} (AI will determine category)`);

    const job = await automationService.generateArticleManually(topic, finalCategory);

    return NextResponse.json({
      success: true,
      message: 'Article generation started - AI will determine appropriate category',
      data: {
        jobId: job.id,
        topic: job.topic.keyword,
        initialCategory: job.topic.category,
        status: job.status,
        createdAt: job.createdAt
      }
    });

  } catch (error) {
    console.error('Error generating article:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate article' 
      },
      { status: 500 }
    );
  }
}
