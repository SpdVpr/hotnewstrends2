import { NextRequest, NextResponse } from 'next/server';

// POST /api/debug/force-article - Force generate specific article
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { position } = body;
    
    if (!position) {
      return NextResponse.json({
        success: false,
        error: 'Position parameter required (e.g., 20 for article #20)'
      }, { status: 400 });
    }
    
    console.log(`🚀 Force generating article #${position}...`);
    
    // Import services
    const { automatedArticleGenerator } = await import('@/lib/services/automated-article-generator');
    
    // Get daily plan
    const dailyPlan = await automatedArticleGenerator.getDailyPlan();
    
    if (!dailyPlan) {
      return NextResponse.json({
        success: false,
        error: 'No daily plan found'
      });
    }
    
    // Find the job
    const job = dailyPlan.jobs.find(j => j.position === parseInt(position));
    
    if (!job) {
      return NextResponse.json({
        success: false,
        error: `Job #${position} not found in daily plan`,
        availableJobs: dailyPlan.jobs.map(j => ({
          position: j.position,
          title: j.trend?.title,
          status: j.status
        }))
      });
    }
    
    console.log(`🎯 Found job #${position}: "${job.trend?.title}" (status: ${job.status})`);
    
    // Reset job if it's stuck
    if (job.status === 'generating') {
      console.log(`🔧 Resetting stuck job #${position} from generating to pending`);
      job.status = 'pending';
      job.startedAt = undefined;
      job.completedAt = undefined;
      job.error = undefined;
    }
    
    // Force generate the article
    try {
      console.log(`🚀 Starting forced generation of article #${position}...`);
      
      // Mark as generating
      job.status = 'generating';
      job.startedAt = new Date().toISOString();
      
      // Save updated plan
      await automatedArticleGenerator.saveDailyPlan(dailyPlan);
      
      // Generate the article
      const result = await automatedArticleGenerator.generateSingleArticle(job.trend, job.position);
      
      if (result.success) {
        // Mark as completed
        job.status = 'completed';
        job.completedAt = new Date().toISOString();
        job.articleId = result.articleId;
        
        console.log(`✅ Article #${position} generated successfully: ${result.articleId}`);
      } else {
        // Mark as failed
        job.status = 'failed';
        job.error = result.error;
        
        console.log(`❌ Article #${position} generation failed: ${result.error}`);
      }
      
      // Save final status
      await automatedArticleGenerator.saveDailyPlan(dailyPlan);
      
      return NextResponse.json({
        success: result.success,
        message: result.success 
          ? `Article #${position} generated successfully`
          : `Article #${position} generation failed`,
        job: {
          position: job.position,
          title: job.trend?.title,
          status: job.status,
          articleId: job.articleId,
          error: job.error,
          startedAt: job.startedAt,
          completedAt: job.completedAt
        },
        result: result
      });
      
    } catch (generationError) {
      console.error(`❌ Error generating article #${position}:`, generationError);
      
      // Mark as failed
      job.status = 'failed';
      job.error = generationError instanceof Error ? generationError.message : 'Unknown error';
      await automatedArticleGenerator.saveDailyPlan(dailyPlan);
      
      return NextResponse.json({
        success: false,
        error: `Failed to generate article #${position}`,
        details: generationError instanceof Error ? generationError.message : 'Unknown error',
        job: {
          position: job.position,
          title: job.trend?.title,
          status: job.status,
          error: job.error
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error in force article generation:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
