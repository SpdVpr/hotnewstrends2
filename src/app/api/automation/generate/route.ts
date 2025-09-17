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
    console.error('❌ Error generating article:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      topic,
      category: finalCategory,
      timestamp: new Date().toISOString()
    });

    // Check for specific error types
    let errorMessage = 'Failed to generate article';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'Article generation timed out - this may be due to Vercel limits';
        statusCode = 408;
      } else if (error.message.includes('API key')) {
        errorMessage = 'API configuration error';
        statusCode = 401;
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'API rate limit exceeded';
        statusCode = 429;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}
