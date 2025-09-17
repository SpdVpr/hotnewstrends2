import { NextRequest, NextResponse } from 'next/server';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

// Standard categories for the blog
const STANDARD_CATEGORIES = [
  {
    id: 'news',
    name: 'News',
    slug: 'news',
    description: 'Latest news and current events',
    color: '#FF3B30',
    icon: '📰',
    order: 1,
    featured: true
  },
  {
    id: 'technology',
    name: 'Technology',
    slug: 'technology',
    description: 'Tech trends, innovations, and digital transformation',
    color: '#007AFF',
    icon: '💻',
    order: 2,
    featured: true
  },
  {
    id: 'business',
    name: 'Business',
    slug: 'business',
    description: 'Business news, market insights, and entrepreneurship',
    color: '#34C759',
    icon: '📊',
    order: 3,
    featured: true
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    slug: 'entertainment',
    description: 'Movies, TV shows, celebrities, and pop culture',
    color: '#FF2D92',
    icon: '🎭',
    order: 4,
    featured: true
  },
  {
    id: 'sports',
    name: 'Sports',
    slug: 'sports',
    description: 'Sports news, scores, and athletic achievements',
    color: '#FF9500',
    icon: '⚽',
    order: 5,
    featured: true
  },
  {
    id: 'science',
    name: 'Science',
    slug: 'science',
    description: 'Scientific discoveries, research, and innovations',
    color: '#5856D6',
    icon: '🔬',
    order: 6,
    featured: true
  },
  {
    id: 'health',
    name: 'Health',
    slug: 'health',
    description: 'Health news, medical breakthroughs, and wellness',
    color: '#32D74B',
    icon: '🏥',
    order: 7,
    featured: false
  },
  {
    id: 'general',
    name: 'General',
    slug: 'general',
    description: 'General topics and miscellaneous content',
    color: '#8E8E93',
    icon: '📝',
    order: 8,
    featured: false
  }
];

// GET /api/categories - Get all categories
export async function GET() {
  try {
    const categoriesCollection = collection(db, COLLECTIONS.CATEGORIES);
    const q = query(categoriesCollection, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const categories: any[] = [];
    querySnapshot.forEach(doc => {
      categories.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return NextResponse.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('❌ Error getting categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get categories' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create/initialize categories
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'initialize') {
      console.log('🏗️ Initializing standard categories...');
      
      const categoriesCollection = collection(db, COLLECTIONS.CATEGORIES);
      const createdCategories = [];
      
      for (const category of STANDARD_CATEGORIES) {
        const now = new Date();
        const categoryData = {
          ...category,
          articleCount: 0,
          createdAt: now,
          updatedAt: now
        };
        
        const docRef = await addDoc(categoriesCollection, categoryData);
        createdCategories.push({
          id: docRef.id,
          ...categoryData
        });
        
        console.log(`✅ Created category: ${category.name}`);
      }
      
      return NextResponse.json({
        success: true,
        message: `Initialized ${createdCategories.length} categories`,
        data: createdCategories
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ Error creating categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create categories' },
      { status: 500 }
    );
  }
}
