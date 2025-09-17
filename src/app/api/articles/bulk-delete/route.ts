import { NextRequest, NextResponse } from 'next/server';
import { firebaseArticlesService } from '@/lib/services/firebase-articles';

// POST /api/articles/bulk-delete - Delete multiple articles
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleIds, deleteAll, filter } = body;

    let idsToDelete: string[] = [];

    if (deleteAll) {
      // Get all articles and filter mock ones
      console.log('🗑️ Fetching all articles to identify mock articles...');
      const allArticles = await firebaseArticlesService.getArticles({
        limit: 1000 // Get a large number to catch all articles
      });
      console.log(`📋 Found ${allArticles.length} total articles`);

      // Filter mock articles (articles without automated_trending source or with specific mock patterns)
      const mockArticles = allArticles.filter(article => {
        const metadata = article.metadata as any;
        const source = metadata?.source;
        
        // Consider mock if:
        // 1. No source metadata
        // 2. Source is not 'automated_trending'
        // 3. Contains mock patterns in title or content
        const isMock = !source || 
                      source !== 'automated_trending' ||
                      article.title.includes('Mock') ||
                      article.title.includes('Sample') ||
                      article.title.includes('Test') ||
                      article.excerpt.includes('This is a sample') ||
                      article.excerpt.includes('mock article');
        
        return isMock;
      });

      idsToDelete = mockArticles.map(article => article.id);
      console.log(`📋 Found ${mockArticles.length} mock articles to delete`);
      
      if (mockArticles.length > 0) {
        console.log('Mock articles:');
        mockArticles.forEach(article => {
          const metadata = article.metadata as any;
          console.log(`- ${article.title} [source: ${metadata?.source || 'none'}]`);
        });
      }

    } else if (articleIds && Array.isArray(articleIds)) {
      idsToDelete = articleIds;
    } else if (filter) {
      // Custom filter logic could be added here
      console.log('🔍 Custom filter not implemented yet');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Custom filter not implemented' 
        },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Either articleIds array or deleteAll flag must be provided' 
        },
        { status: 400 }
      );
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No articles to delete',
        deletedCount: 0
      });
    }

    // Delete articles one by one
    console.log(`🗑️ Deleting ${idsToDelete.length} articles...`);
    let deletedCount = 0;
    let errors: string[] = [];

    for (const id of idsToDelete) {
      try {
        await firebaseArticlesService.deleteArticle(id);
        deletedCount++;
        console.log(`✅ Deleted article: ${id}`);
      } catch (error) {
        const errorMsg = `Failed to delete ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    const response = {
      success: true,
      message: `Bulk delete completed. ${deletedCount} articles deleted.`,
      deletedCount,
      totalRequested: idsToDelete.length,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log(`🎯 Bulk delete summary: ${deletedCount}/${idsToDelete.length} articles deleted`);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in bulk delete:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform bulk delete',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
