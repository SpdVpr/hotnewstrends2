// Firebase service for articles management
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  serverTimestamp,
  DocumentSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { db, COLLECTIONS, FirebaseArticle, createTimestamp } from '@/lib/firebase';

export interface ArticleFilters {
  category?: string;
  status?: 'draft' | 'published' | 'archived';
  author?: string;
  featured?: boolean;
  trending?: boolean;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ArticleSearchOptions {
  searchTerm?: string;
  filters?: ArticleFilters;
  sortBy?: 'publishedAt' | 'views' | 'likes' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  startAfter?: DocumentSnapshot;
}

class FirebaseArticlesService {
  private articlesCollection = collection(db, COLLECTIONS.ARTICLES);

  // Create a new article
  async createArticle(articleData: Omit<FirebaseArticle, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'likes' | 'shares' | 'comments'>): Promise<string> {
    try {
      console.log('🔧 DEBUG: Firebase project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
      console.log('🔧 DEBUG: Firebase config check:', {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'MISSING',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'SET' : 'MISSING',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'SET' : 'MISSING'
      });
      console.log('🔧 DEBUG: Attempting to create article:', articleData.title);

      const now = createTimestamp();

      // Filter out undefined values to prevent Firebase errors
      const cleanedData = Object.fromEntries(
        Object.entries(articleData).filter(([_, value]) => value !== undefined)
      );

      const article: Omit<FirebaseArticle, 'id'> = {
        ...cleanedData,
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        createdAt: now,
        updatedAt: now
      } as Omit<FirebaseArticle, 'id'>;

      const docRef = await addDoc(this.articlesCollection, article);
      console.log('✅ Article created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating article:', error);
      throw new Error(`Failed to create article: ${error}`);
    }
  }

  // Get article by ID
  async getArticleById(id: string): Promise<FirebaseArticle | null> {
    try {
      const docRef = doc(db, COLLECTIONS.ARTICLES, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as FirebaseArticle;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting article:', error);
      throw new Error(`Failed to get article: ${error}`);
    }
  }

  // Get article by slug
  async getArticleBySlug(slug: string): Promise<FirebaseArticle | null> {
    try {
      const q = query(
        this.articlesCollection,
        where('slug', '==', slug),
        where('status', '==', 'published'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        } as FirebaseArticle;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting article by slug:', error);
      throw new Error(`Failed to get article by slug: ${error}`);
    }
  }

  // Search and filter articles
  async searchArticles(options: ArticleSearchOptions = {}): Promise<{
    articles: FirebaseArticle[];
    hasMore: boolean;
    lastDoc?: DocumentSnapshot;
  }> {
    try {
      const {
        filters = {},
        sortBy = 'publishedAt',
        sortOrder = 'desc',
        limit: limitCount = 20,
        startAfter: startAfterDoc
      } = options;

      // Build query constraints
      const constraints: QueryConstraint[] = [];

      // Add filters
      if (filters.category) {
        constraints.push(where('category.slug', '==', filters.category));
      }
      
      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      } else {
        // Default to published articles
        constraints.push(where('status', '==', 'published'));
      }
      
      if (filters.author) {
        constraints.push(where('author', '==', filters.author));
      }
      
      if (filters.featured !== undefined) {
        constraints.push(where('featured', '==', filters.featured));
      }
      
      if (filters.trending !== undefined) {
        constraints.push(where('trending', '==', filters.trending));
      }
      
      if (filters.tags && filters.tags.length > 0) {
        constraints.push(where('tags', 'array-contains-any', filters.tags));
      }

      // Add sorting
      constraints.push(orderBy(sortBy, sortOrder));
      
      // Add pagination
      constraints.push(limit(limitCount + 1)); // Get one extra to check if there are more
      
      if (startAfterDoc) {
        constraints.push(startAfter(startAfterDoc));
      }

      // Execute query
      const q = query(this.articlesCollection, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const articles: FirebaseArticle[] = [];
      const docs = querySnapshot.docs;
      
      // Check if there are more results
      const hasMore = docs.length > limitCount;
      const articlesToReturn = hasMore ? docs.slice(0, -1) : docs;
      
      articlesToReturn.forEach(doc => {
        articles.push({
          id: doc.id,
          ...doc.data()
        } as FirebaseArticle);
      });

      return {
        articles,
        hasMore,
        lastDoc: articlesToReturn[articlesToReturn.length - 1]
      };
    } catch (error) {
      console.error('❌ Error searching articles:', error);
      throw new Error(`Failed to search articles: ${error}`);
    }
  }

  // Get featured articles
  async getFeaturedArticles(limitCount: number = 5): Promise<FirebaseArticle[]> {
    try {
      const q = query(
        this.articlesCollection,
        where('status', '==', 'published'),
        where('featured', '==', true),
        orderBy('publishedAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const articles: FirebaseArticle[] = [];
      
      querySnapshot.forEach(doc => {
        articles.push({
          id: doc.id,
          ...doc.data()
        } as FirebaseArticle);
      });
      
      return articles;
    } catch (error) {
      console.error('❌ Error getting featured articles:', error);
      throw new Error(`Failed to get featured articles: ${error}`);
    }
  }

  // Get trending articles
  async getTrendingArticles(limitCount: number = 10): Promise<FirebaseArticle[]> {
    try {
      const q = query(
        this.articlesCollection,
        where('status', '==', 'published'),
        where('trending', '==', true),
        orderBy('views', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const articles: FirebaseArticle[] = [];
      
      querySnapshot.forEach(doc => {
        articles.push({
          id: doc.id,
          ...doc.data()
        } as FirebaseArticle);
      });
      
      return articles;
    } catch (error) {
      console.error('❌ Error getting trending articles:', error);
      throw new Error(`Failed to get trending articles: ${error}`);
    }
  }

  // Get articles by category
  async getArticlesByCategory(categorySlug: string, limitCount: number = 20): Promise<FirebaseArticle[]> {
    try {
      const q = query(
        this.articlesCollection,
        where('category.slug', '==', categorySlug),
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const articles: FirebaseArticle[] = [];
      
      querySnapshot.forEach(doc => {
        articles.push({
          id: doc.id,
          ...doc.data()
        } as FirebaseArticle);
      });
      
      return articles;
    } catch (error) {
      console.error('❌ Error getting articles by category:', error);
      throw new Error(`Failed to get articles by category: ${error}`);
    }
  }

  // Update article
  async updateArticle(id: string, updates: Partial<FirebaseArticle>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.ARTICLES, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: createTimestamp()
      });
      
      console.log('✅ Article updated:', id);
    } catch (error) {
      console.error('❌ Error updating article:', error);
      throw new Error(`Failed to update article: ${error}`);
    }
  }

  // Delete article
  async deleteArticle(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.ARTICLES, id);
      await deleteDoc(docRef);
      
      console.log('✅ Article deleted:', id);
    } catch (error) {
      console.error('❌ Error deleting article:', error);
      throw new Error(`Failed to delete article: ${error}`);
    }
  }

  // Increment article views
  async incrementViews(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.ARTICLES, id);
      await updateDoc(docRef, {
        views: increment(1)
      });
    } catch (error) {
      console.error('❌ Error incrementing views:', error);
      // Don't throw error for view tracking failures
    }
  }

  // Increment article likes
  async incrementLikes(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.ARTICLES, id);
      await updateDoc(docRef, {
        likes: increment(1)
      });
    } catch (error) {
      console.error('❌ Error incrementing likes:', error);
      throw new Error(`Failed to increment likes: ${error}`);
    }
  }

  // Increment article shares
  async incrementShares(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.ARTICLES, id);
      await updateDoc(docRef, {
        shares: increment(1)
      });
    } catch (error) {
      console.error('❌ Error incrementing shares:', error);
      // Don't throw error for share tracking failures
    }
  }

  // Get article statistics
  async getArticleStats(): Promise<{
    total: number;
    published: number;
    draft: number;
    archived: number;
    totalViews: number;
    totalLikes: number;
  }> {
    try {
      // This is a simplified version - in production, you might want to use
      // Firebase Functions or aggregation queries for better performance
      const allArticlesQuery = query(this.articlesCollection);
      const querySnapshot = await getDocs(allArticlesQuery);
      
      let total = 0;
      let published = 0;
      let draft = 0;
      let archived = 0;
      let totalViews = 0;
      let totalLikes = 0;
      
      querySnapshot.forEach(doc => {
        const article = doc.data() as FirebaseArticle;
        total++;
        
        switch (article.status) {
          case 'published':
            published++;
            break;
          case 'draft':
            draft++;
            break;
          case 'archived':
            archived++;
            break;
        }
        
        totalViews += article.views || 0;
        totalLikes += article.likes || 0;
      });
      
      return {
        total,
        published,
        draft,
        archived,
        totalViews,
        totalLikes
      };
    } catch (error) {
      console.error('❌ Error getting article stats:', error);
      throw new Error(`Failed to get article stats: ${error}`);
    }
  }

  // Get articles count with filters (for admin dashboard)
  async getArticlesCount(filters: {
    category?: string;
    status?: string;
    search?: string;
  } = {}): Promise<number> {
    try {
      let q = query(this.articlesCollection);

      // Add filters
      if (filters.category && filters.category !== 'all') {
        q = query(q, where('category.slug', '==', filters.category.toLowerCase()));
      }

      if (filters.status && filters.status !== 'all') {
        q = query(q, where('status', '==', filters.status));
      }

      const snapshot = await getDocs(q);

      // Apply search filter if needed (client-side)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const filteredDocs = snapshot.docs.filter(doc => {
          const data = doc.data();
          return data.title?.toLowerCase().includes(searchLower) ||
                 data.excerpt?.toLowerCase().includes(searchLower) ||
                 data.content?.toLowerCase().includes(searchLower);
        });
        return filteredDocs.length;
      }

      return snapshot.size;
    } catch (error) {
      console.error('❌ Error getting articles count:', error);
      return 0;
    }
  }

  // Get articles with enhanced filtering for admin dashboard
  async getArticles(options: {
    limit?: number;
    offset?: number;
    category?: string;
    status?: string;
    search?: string;
  } = {}): Promise<FirebaseArticle[]> {
    try {
      const { limit: limitCount = 10, offset = 0, category, status, search } = options;

      console.log(`🔍 Getting articles with options:`, { limitCount, offset, category, status, search });

      // Použijeme pouze createdAt řazení bez where klauzulí pro vyhnuti se composite indexům
      let q = query(this.articlesCollection, orderBy('createdAt', 'desc'));

      // Apply pagination - načteme více článků kvůli client-side filtrování
      const fetchLimit = Math.max(limitCount * 3, 50); // Načteme 3x více pro filtrování
      q = query(q, limit(fetchLimit));
      // Offset se aplikuje client-side po filtrování

      const querySnapshot = await getDocs(q);
      console.log(`📊 Found ${querySnapshot.docs.length} articles in Firebase`);

      let articles = querySnapshot.docs.map(doc => {
        const data = doc.data();

        // Generate fallback slug if missing
        let slug = data.slug;
        if (!slug && data.title) {
          slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
          console.log(`🔧 Generated fallback slug for "${data.title}": "${slug}"`);
        }

        return {
          id: doc.id,
          ...data,
          slug: slug || `article-${doc.id}`, // Fallback slug
          author: data.author || 'Trendy Blogger', // Fallback author
          publishedAt: data.publishedAt?.toDate?.() || new Date(data.publishedAt),
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
        } as FirebaseArticle;
      });

      // Apply status filter client-side to avoid composite index
      if (status && status !== 'all') {
        articles = articles.filter(article => article.status === status);
      } else if (!status) {
        // Pokud není specifikován status, zobraz pouze publikované články
        articles = articles.filter(article => article.status === 'published' || article.published === true);
      }

      // Apply category filter client-side
      if (category && category !== 'all') {
        articles = articles.filter(article => {
          // Podporujeme jak starý formát (objekt) tak nový (string)
          if (typeof article.category === 'object' && article.category?.slug) {
            return article.category.slug.toLowerCase() === category.toLowerCase();
          } else if (typeof article.category === 'string') {
            return article.category.toLowerCase() === category.toLowerCase();
          }
          return false;
        });
      }

      // Apply search filter (client-side for simplicity)
      if (search) {
        const searchLower = search.toLowerCase();
        articles = articles.filter(article =>
          article.title.toLowerCase().includes(searchLower) ||
          article.excerpt.toLowerCase().includes(searchLower) ||
          article.content.toLowerCase().includes(searchLower)
        );
      }

      // Apply pagination after filtering
      const startIndex = offset;
      const endIndex = startIndex + limitCount;
      articles = articles.slice(startIndex, endIndex);

      console.log(`✅ Returning ${articles.length} articles (after filtering and pagination)`);
      if (articles.length > 0) {
        console.log(`📄 First article:`, {
          id: articles[0].id,
          title: articles[0].title,
          status: articles[0].status,
          published: articles[0].published,
          author: articles[0].author,
          category: typeof articles[0].category === 'object' ? articles[0].category?.name : articles[0].category,
          slug: articles[0].slug,
          createdAt: articles[0].createdAt
        });
      }

      return articles;
    } catch (error) {
      console.error('❌ Error getting articles:', error);
      throw new Error(`Failed to get articles: ${error}`);
    }
  }
}

// Export class and singleton instance
export { FirebaseArticlesService };
export const firebaseArticlesService = new FirebaseArticlesService();
