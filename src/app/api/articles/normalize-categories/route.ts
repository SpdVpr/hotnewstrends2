import { NextRequest, NextResponse } from 'next/server';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';

// Category mapping from current messy categories to standard ones
const CATEGORY_MAPPING: Record<string, any> = {
  // News variations
  'NEWS': { id: 'news', name: 'News', slug: 'news', color: '#FF3B30' },
  'News': { id: 'news', name: 'News', slug: 'news', color: '#FF3B30' },
  'news': { id: 'news', name: 'News', slug: 'news', color: '#FF3B30' },
  
  // Entertainment variations
  '🎭 ENTERTAINMENT': { id: 'entertainment', name: 'Entertainment', slug: 'entertainment', color: '#FF2D92' },
  'ENTERTAINMENT': { id: 'entertainment', name: 'Entertainment', slug: 'entertainment', color: '#FF2D92' },
  'Entertainment**': { id: 'entertainment', name: 'Entertainment', slug: 'entertainment', color: '#FF2D92' },
  'Entertainment': { id: 'entertainment', name: 'Entertainment', slug: 'entertainment', color: '#FF2D92' },
  'entertainment': { id: 'entertainment', name: 'Entertainment', slug: 'entertainment', color: '#FF2D92' },
  
  // Sports variations
  '⚽ SPORTS': { id: 'sports', name: 'Sports', slug: 'sports', color: '#FF9500' },
  'Sports': { id: 'sports', name: 'Sports', slug: 'sports', color: '#FF9500' },
  'sports': { id: 'sports', name: 'Sports', slug: 'sports', color: '#FF9500' },
  
  // Business variations
  '**Business**': { id: 'business', name: 'Business', slug: 'business', color: '#34C759' },
  'Business': { id: 'business', name: 'Business', slug: 'business', color: '#34C759' },
  'business': { id: 'business', name: 'Business', slug: 'business', color: '#34C759' },
  
  // Technology variations
  'Technology': { id: 'technology', name: 'Technology', slug: 'technology', color: '#007AFF' },
  'technology': { id: 'technology', name: 'Technology', slug: 'technology', color: '#007AFF' },
  
  // Science variations
  'Science': { id: 'science', name: 'Science', slug: 'science', color: '#5856D6' },
  'science': { id: 'science', name: 'Science', slug: 'science', color: '#5856D6' },
  
  // Health variations
  'Health': { id: 'health', name: 'Health', slug: 'health', color: '#32D74B' },
  'health': { id: 'health', name: 'Health', slug: 'health', color: '#32D74B' },
  
  // General variations
  'general': { id: 'general', name: 'General', slug: 'general', color: '#8E8E93' },
  'General': { id: 'general', name: 'General', slug: 'general', color: '#8E8E93' }
};

// POST /api/articles/normalize-categories - Normalize all article categories
export async function POST(request: NextRequest) {
  try {
    const { dryRun = true } = await request.json();
    
    console.log(`🔧 ${dryRun ? 'DRY RUN:' : 'EXECUTING:'} Normalizing article categories...`);
    
    // Get all articles
    const articlesCollection = collection(db, COLLECTIONS.ARTICLES);
    const querySnapshot = await getDocs(articlesCollection);
    
    const updates: Array<{
      id: string;
      title: string;
      currentCategory: any;
      newCategory: any;
    }> = [];
    
    const unmappedCategories = new Set<string>();
    
    querySnapshot.forEach(doc => {
      const article = doc.data();
      const currentCategory = article.category;
      
      let categoryKey: string;
      if (typeof currentCategory === 'string') {
        categoryKey = currentCategory;
      } else if (currentCategory?.name) {
        categoryKey = currentCategory.name;
      } else if (currentCategory?.id) {
        categoryKey = currentCategory.id;
      } else {
        categoryKey = 'general';
      }
      
      const newCategory = CATEGORY_MAPPING[categoryKey];
      
      if (newCategory) {
        // Only update if category is different
        const needsUpdate = typeof currentCategory === 'string' || 
                           currentCategory?.id !== newCategory.id ||
                           currentCategory?.name !== newCategory.name;
        
        if (needsUpdate) {
          updates.push({
            id: doc.id,
            title: article.title?.substring(0, 50) + '...',
            currentCategory,
            newCategory
          });
        }
      } else {
        unmappedCategories.add(categoryKey);
        console.warn(`⚠️ No mapping found for category: "${categoryKey}"`);
      }
    });
    
    console.log(`📊 Found ${updates.length} articles to update`);
    console.log(`⚠️ Unmapped categories:`, Array.from(unmappedCategories));
    
    if (!dryRun && updates.length > 0) {
      console.log('🚀 Executing updates...');
      
      // Use batch writes for better performance
      const batch = writeBatch(db);
      
      updates.forEach(update => {
        const docRef = doc(db, COLLECTIONS.ARTICLES, update.id);
        batch.update(docRef, {
          category: update.newCategory,
          updatedAt: new Date()
        });
      });
      
      await batch.commit();
      console.log(`✅ Updated ${updates.length} articles`);
    }
    
    return NextResponse.json({
      success: true,
      dryRun,
      data: {
        totalArticles: querySnapshot.size,
        articlesToUpdate: updates.length,
        updates: updates.slice(0, 10), // Show first 10 for preview
        unmappedCategories: Array.from(unmappedCategories),
        message: dryRun 
          ? `DRY RUN: Would update ${updates.length} articles`
          : `Updated ${updates.length} articles`
      }
    });
    
  } catch (error) {
    console.error('❌ Error normalizing categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to normalize categories' },
      { status: 500 }
    );
  }
}

// GET /api/articles/normalize-categories - Preview normalization
export async function GET() {
  try {
    // Get all articles and analyze categories
    const articlesCollection = collection(db, COLLECTIONS.ARTICLES);
    const querySnapshot = await getDocs(articlesCollection);
    
    const categoryStats: Record<string, number> = {};
    const categoryExamples: Record<string, string[]> = {};
    
    querySnapshot.forEach(doc => {
      const article = doc.data();
      const category = article.category;
      
      let categoryKey: string;
      if (typeof category === 'string') {
        categoryKey = category;
      } else if (category?.name) {
        categoryKey = category.name;
      } else if (category?.id) {
        categoryKey = category.id;
      } else {
        categoryKey = 'unknown';
      }
      
      categoryStats[categoryKey] = (categoryStats[categoryKey] || 0) + 1;
      
      if (!categoryExamples[categoryKey]) {
        categoryExamples[categoryKey] = [];
      }
      if (categoryExamples[categoryKey].length < 3) {
        categoryExamples[categoryKey].push(article.title?.substring(0, 40) + '...');
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        totalArticles: querySnapshot.size,
        categoryStats,
        categoryExamples,
        availableMappings: Object.keys(CATEGORY_MAPPING),
        unmappedCategories: Object.keys(categoryStats).filter(cat => !CATEGORY_MAPPING[cat])
      }
    });
    
  } catch (error) {
    console.error('❌ Error analyzing categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze categories' },
      { status: 500 }
    );
  }
}
