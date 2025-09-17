import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ProcessedTopic {
  keyword: string;
  processedAt: Date;
  expiresAt: Date;
}

class FirebaseProcessedTopicsService {
  private collectionName = 'processed_topics';

  /**
   * Mark a topic as processed (add to blacklist for 48 hours)
   */
  async markTopicAsProcessed(keyword: string): Promise<void> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // +48 hours
      
      const processedTopic: ProcessedTopic = {
        keyword: keyword.toLowerCase().trim(),
        processedAt: now,
        expiresAt
      };

      const docRef = doc(db, this.collectionName, this.sanitizeKeyword(keyword));
      await setDoc(docRef, {
        keyword: processedTopic.keyword,
        processedAt: Timestamp.fromDate(processedTopic.processedAt),
        expiresAt: Timestamp.fromDate(processedTopic.expiresAt)
      });

      console.log(`🚫 Topic "${keyword}" marked as processed until ${expiresAt.toLocaleString()}`);
    } catch (error) {
      console.error(`❌ Failed to mark topic "${keyword}" as processed:`, error);
      throw error;
    }
  }

  /**
   * Check if a topic has been processed in the last 48 hours
   */
  async isTopicProcessed(keyword: string): Promise<boolean> {
    try {
      const normalizedKeyword = keyword.toLowerCase().trim();
      const now = new Date();

      // Query for the specific topic
      const docRef = doc(db, this.collectionName, this.sanitizeKeyword(keyword));
      const docSnap = await getDocs(query(
        collection(db, this.collectionName),
        where('keyword', '==', normalizedKeyword),
        where('expiresAt', '>', Timestamp.fromDate(now))
      ));

      const isProcessed = !docSnap.empty;
      
      if (isProcessed) {
        const processedTopic = docSnap.docs[0].data();
        const expiresAt = processedTopic.expiresAt.toDate();
        console.log(`🚫 Topic "${keyword}" already processed, expires: ${expiresAt.toLocaleString()}`);
      } else {
        console.log(`✅ Topic "${keyword}" not processed - safe to add to queue`);
      }

      return isProcessed;
    } catch (error) {
      console.error(`❌ Failed to check if topic "${keyword}" is processed:`, error);
      // On error, allow processing (err on the side of generation)
      return false;
    }
  }

  /**
   * Get all currently processed topics (for debugging)
   */
  async getProcessedTopics(): Promise<ProcessedTopic[]> {
    try {
      const now = new Date();
      const q = query(
        collection(db, this.collectionName),
        where('expiresAt', '>', Timestamp.fromDate(now))
      );

      const querySnapshot = await getDocs(q);
      const processedTopics: ProcessedTopic[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        processedTopics.push({
          keyword: data.keyword,
          processedAt: data.processedAt.toDate(),
          expiresAt: data.expiresAt.toDate()
        });
      });

      console.log(`📋 Found ${processedTopics.length} currently processed topics`);
      return processedTopics;
    } catch (error) {
      console.error('❌ Failed to get processed topics:', error);
      return [];
    }
  }

  /**
   * Clean up expired processed topics (maintenance)
   */
  async cleanupExpiredTopics(): Promise<number> {
    try {
      const now = new Date();
      const q = query(
        collection(db, this.collectionName),
        where('expiresAt', '<=', Timestamp.fromDate(now))
      );

      const querySnapshot = await getDocs(q);
      let deletedCount = 0;

      for (const docSnapshot of querySnapshot.docs) {
        await deleteDoc(docSnapshot.ref);
        deletedCount++;
      }

      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} expired processed topics`);
      }

      return deletedCount;
    } catch (error) {
      console.error('❌ Failed to cleanup expired topics:', error);
      return 0;
    }
  }

  /**
   * Sanitize keyword for use as Firestore document ID
   */
  private sanitizeKeyword(keyword: string): string {
    return keyword
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Limit length
  }

  /**
   * Batch check multiple topics
   */
  async areTopicsProcessed(keywords: string[]): Promise<{ [keyword: string]: boolean }> {
    const results: { [keyword: string]: boolean } = {};
    
    // Process in batches to avoid too many concurrent requests
    for (const keyword of keywords) {
      results[keyword] = await this.isTopicProcessed(keyword);
    }

    return results;
  }
}

export const firebaseProcessedTopicsService = new FirebaseProcessedTopicsService();
