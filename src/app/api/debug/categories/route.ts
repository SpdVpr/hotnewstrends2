import { NextResponse } from 'next/server';
import { firebaseArticlesService } from '@/lib/services/firebase-articles';

export async function GET() {
  try {
    console.log('🔍 Debug: Checking article categories...');
    
    // Get recent articles
    const articles = await firebaseArticlesService.getArticles({
      limit: 20,
      status: 'published'
    });
    
    console.log(`📊 Found ${articles.length} articles`);
    
    // Analyze categories
    const categoryStats: Record<string, number> = {};
    const categoryExamples: Record<string, any[]> = {};
    
    articles.forEach((article, index) => {
      const category = article.category;
      
      // Log first 5 articles in detail
      if (index < 5) {
        console.log(`${index + 1}. ${article.title?.substring(0, 50)}...`);
        console.log(`   Category: ${JSON.stringify(category)}`);
        console.log(`   Type: ${typeof category}`);
        console.log(`   Status: ${article.status}`);
        console.log('');
      }
      
      // Count categories
      const categoryKey = typeof category === 'string' ? category : 
                         category?.name || category?.slug || category?.id || 'unknown';
      
      categoryStats[categoryKey] = (categoryStats[categoryKey] || 0) + 1;
      
      if (!categoryExamples[categoryKey]) {
        categoryExamples[categoryKey] = [];
      }
      if (categoryExamples[categoryKey].length < 2) {
        categoryExamples[categoryKey].push({
          title: article.title?.substring(0, 40) + '...',
          category: category,
          categoryType: typeof category
        });
      }
    });
    
    console.log('📈 Category Statistics:', categoryStats);
    
    // Generate recommended mappings
    const recommendedMappings: Record<string, string> = {};
    Object.keys(categoryStats).forEach(cat => {
      recommendedMappings[cat] = cat.toLowerCase().replace(/[^a-z0-9]/g, '');
    });
    
    return NextResponse.json({
      success: true,
      data: {
        totalArticles: articles.length,
        categoryStats,
        categoryExamples,
        recommendedMappings,
        availableCategories: Object.keys(categoryStats)
      }
    });
    
  } catch (error) {
    console.error('❌ Debug categories error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
