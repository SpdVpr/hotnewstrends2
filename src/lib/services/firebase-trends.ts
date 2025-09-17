/**
 * Firebase Trends Service
 * Manages trending topics storage and retrieval in Firebase
 */

import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where, 
  Timestamp,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TrendingTopic } from './google-trends';

export interface FirebaseTrend extends TrendingTopic {
  id?: string;
  savedAt: Timestamp;
  batchId: string; // Unique ID for each 6x daily batch
  articleGenerated?: boolean; // Track if article was generated
  articleId?: string; // Reference to generated article
}

class FirebaseTrendsService {
  private readonly COLLECTION_NAME = 'trending_topics';
  private readonly MAX_TRENDS_PER_BATCH = 20;
  private readonly RETENTION_DAYS = 7; // Keep trends for 7 days

  /**
   * Save a batch of trending topics to Firebase
   */
  async saveTrendsBatch(trends: TrendingTopic[]): Promise<string> {
    try {
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const batch = writeBatch(db);
      const trendsCollection = collection(db, this.COLLECTION_NAME);

      console.log(`💾 Saving ${trends.length} trends to Firebase with batchId: ${batchId}`);

      // Prepare trends for saving
      const trendsToSave = trends.slice(0, this.MAX_TRENDS_PER_BATCH).map(trend => ({
        ...trend,
        savedAt: Timestamp.now(),
        batchId,
        articleGenerated: false
      }));

      // Add each trend to batch
      for (const trend of trendsToSave) {
        const docRef = doc(trendsCollection);
        batch.set(docRef, trend);
      }

      // Execute batch write
      await batch.commit();

      console.log(`✅ Successfully saved ${trendsToSave.length} trends to Firebase`);
      
      // Clean up old trends
      await this.cleanupOldTrends();

      return batchId;
    } catch (error) {
      console.error('❌ Error saving trends batch:', error);
      throw new Error('Failed to save trends to Firebase');
    }
  }

  /**
   * Get latest trends batch
   */
  async getLatestTrends(limitCount: number = 20): Promise<FirebaseTrend[]> {
    try {
      const trendsCollection = collection(db, this.COLLECTION_NAME);
      const q = query(
        trendsCollection,
        orderBy('savedAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const trends: FirebaseTrend[] = [];

      snapshot.forEach(doc => {
        trends.push({
          id: doc.id,
          ...doc.data()
        } as FirebaseTrend);
      });

      console.log(`📊 Retrieved ${trends.length} latest trends from Firebase`);
      return trends;
    } catch (error) {
      console.error('❌ Error getting latest trends:', error);
      return [];
    }
  }

  /**
   * Get trends that need articles generated
   */
  async getTrendsNeedingArticles(limitCount: number = 10): Promise<FirebaseTrend[]> {
    try {
      const trendsCollection = collection(db, this.COLLECTION_NAME);
      const q = query(
        trendsCollection,
        where('articleGenerated', '==', false),
        orderBy('searchVolume', 'desc'), // Prioritize high-traffic trends
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const trends: FirebaseTrend[] = [];

      snapshot.forEach(doc => {
        trends.push({
          id: doc.id,
          ...doc.data()
        } as FirebaseTrend);
      });

      console.log(`📝 Found ${trends.length} trends needing articles`);
      return trends;
    } catch (error) {
      console.error('❌ Error getting trends needing articles:', error);
      return [];
    }
  }

  /**
   * Mark trend as having article generated
   */
  async markTrendAsGenerated(trendId: string, articleId: string): Promise<void> {
    try {
      const trendDoc = doc(db, this.COLLECTION_NAME, trendId);
      await writeBatch(db).update(trendDoc, {
        articleGenerated: true,
        articleId: articleId,
        generatedAt: Timestamp.now()
      }).commit();

      console.log(`✅ Marked trend ${trendId} as generated with article ${articleId}`);
    } catch (error) {
      console.error('❌ Error marking trend as generated:', error);
      throw error;
    }
  }

  /**
   * Check if similar trend already has article
   */
  async hasSimilarArticle(keyword: string, similarity: number = 0.7): Promise<boolean> {
    try {
      const trendsCollection = collection(db, this.COLLECTION_NAME);
      const q = query(
        trendsCollection,
        where('articleGenerated', '==', true),
        orderBy('savedAt', 'desc'),
        limit(50) // Check last 50 generated articles
      );

      const snapshot = await getDocs(q);
      const keywordLower = keyword.toLowerCase();

      for (const doc of snapshot.docs) {
        const trend = doc.data() as FirebaseTrend;
        const trendKeyword = trend.keyword.toLowerCase();
        
        // Simple similarity check - can be enhanced with more sophisticated algorithms
        if (this.calculateSimilarity(keywordLower, trendKeyword) >= similarity) {
          console.log(`🔍 Found similar article for "${keyword}" -> "${trend.keyword}"`);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('❌ Error checking similar articles:', error);
      return false; // Err on the side of generating article
    }
  }

  /**
   * Get trends statistics
   */
  async getTrendsStats(): Promise<{
    total: number;
    needingArticles: number;
    articlesGenerated: number;
    latestBatchId: string | null;
  }> {
    try {
      const trendsCollection = collection(db, this.COLLECTION_NAME);
      
      // Get total count
      const totalSnapshot = await getDocs(trendsCollection);
      const total = totalSnapshot.size;

      // Get needing articles count
      const needingQuery = query(trendsCollection, where('articleGenerated', '==', false));
      const needingSnapshot = await getDocs(needingQuery);
      const needingArticles = needingSnapshot.size;

      // Get generated articles count
      const generatedQuery = query(trendsCollection, where('articleGenerated', '==', true));
      const generatedSnapshot = await getDocs(generatedQuery);
      const articlesGenerated = generatedSnapshot.size;

      // Get latest batch ID
      const latestQuery = query(trendsCollection, orderBy('savedAt', 'desc'), limit(1));
      const latestSnapshot = await getDocs(latestQuery);
      const latestBatchId = latestSnapshot.empty ? null : latestSnapshot.docs[0].data().batchId;

      return {
        total,
        needingArticles,
        articlesGenerated,
        latestBatchId
      };
    } catch (error) {
      console.error('❌ Error getting trends stats:', error);
      return {
        total: 0,
        needingArticles: 0,
        articlesGenerated: 0,
        latestBatchId: null
      };
    }
  }

  /**
   * Clean up old trends (older than retention period)
   */
  private async cleanupOldTrends(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);
      const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

      const trendsCollection = collection(db, this.COLLECTION_NAME);
      const oldTrendsQuery = query(
        trendsCollection,
        where('savedAt', '<', cutoffTimestamp)
      );

      const snapshot = await getDocs(oldTrendsQuery);
      
      if (snapshot.empty) {
        return;
      }

      const batch = writeBatch(db);
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`🧹 Cleaned up ${snapshot.size} old trends`);
    } catch (error) {
      console.error('❌ Error cleaning up old trends:', error);
    }
  }

  /**
   * Simple similarity calculation (Jaccard similarity)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(' '));
    const words2 = new Set(str2.split(' '));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
}

export const firebaseTrendsService = new FirebaseTrendsService();
