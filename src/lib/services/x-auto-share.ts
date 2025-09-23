import { xApiService, TweetData } from './x-api';
import { getFirestore, collection, query, where, orderBy, limit, getDocs, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface Article {
  id: string;
  title: string;
  slug: string;
  category: {
    name: string;
  };
  publishedAt: Timestamp;
  seoKeywords?: string[];
  xShared?: boolean;
  xSharedAt?: Timestamp;
  xTweetId?: string;
}

interface ShareResult {
  success: boolean;
  articlesShared: number;
  errors: string[];
  rateLimitHit?: boolean;
}

interface ShareLog {
  articleId: string;
  articleTitle: string;
  tweetId?: string;
  success: boolean;
  error?: string;
  sharedAt: Timestamp;
}

class XAutoShareService {
  private readonly DAILY_SHARE_LIMIT = 4; // Free tier: 4 posts per day
  private readonly COLLECTION_ARTICLES = 'articles';
  private readonly COLLECTION_X_LOGS = 'x_share_logs';

  /**
   * Get articles that haven't been shared on X yet
   */
  private async getUnsharedArticles(limitCount: number = this.DAILY_SHARE_LIMIT): Promise<Article[]> {
    try {
      const articlesRef = collection(db, this.COLLECTION_ARTICLES);
      
      // Get published articles that haven't been shared on X
      const q = query(
        articlesRef,
        where('status', '==', 'published'),
        where('xShared', '!=', true),
        orderBy('publishedAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Article));
    } catch (error) {
      console.error('Error fetching unshared articles:', error);
      return [];
    }
  }

  /**
   * Get today's share count
   */
  private async getTodayShareCount(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const logsRef = collection(db, this.COLLECTION_X_LOGS);
      const q = query(
        logsRef,
        where('sharedAt', '>=', Timestamp.fromDate(today)),
        where('sharedAt', '<', Timestamp.fromDate(tomorrow)),
        where('success', '==', true)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting today share count:', error);
      return 0;
    }
  }

  /**
   * Log share attempt
   */
  private async logShareAttempt(log: ShareLog): Promise<void> {
    try {
      const logsRef = collection(db, this.COLLECTION_X_LOGS);
      await addDoc(logsRef, log);
    } catch (error) {
      console.error('Error logging share attempt:', error);
    }
  }

  /**
   * Update article with X share status
   */
  private async updateArticleShareStatus(
    articleId: string, 
    success: boolean, 
    tweetId?: string
  ): Promise<void> {
    try {
      const articleRef = doc(db, this.COLLECTION_ARTICLES, articleId);
      const updateData: any = {
        xShared: success,
        xSharedAt: Timestamp.now()
      };

      if (tweetId) {
        updateData.xTweetId = tweetId;
      }

      await updateDoc(articleRef, updateData);
    } catch (error) {
      console.error('Error updating article share status:', error);
    }
  }

  /**
   * Convert article to tweet data
   */
  private articleToTweetData(article: Article): TweetData {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hotnewstrends.com';
    const articleUrl = `${baseUrl}/article/${article.slug}`;

    return {
      title: article.title,
      url: articleUrl,
      category: article.category.name,
      tags: article.seoKeywords?.slice(0, 3) || []
    };
  }

  /**
   * Share articles on X automatically
   */
  async shareArticles(): Promise<ShareResult> {
    const result: ShareResult = {
      success: true,
      articlesShared: 0,
      errors: []
    };

    try {
      // Check if X API is configured
      if (!xApiService.isConfigured()) {
        result.success = false;
        result.errors.push('X API not configured');
        return result;
      }

      // Check today's share count
      const todayShares = await this.getTodayShareCount();
      const remainingShares = this.DAILY_SHARE_LIMIT - todayShares;

      if (remainingShares <= 0) {
        result.errors.push(`Daily share limit reached (${this.DAILY_SHARE_LIMIT})`);
        return result;
      }

      console.log(`Can share ${remainingShares} more articles today`);

      // Get articles to share
      const articles = await this.getUnsharedArticles(remainingShares);
      
      if (articles.length === 0) {
        result.errors.push('No articles available to share');
        return result;
      }

      console.log(`Found ${articles.length} articles to share`);

      // Share each article
      for (const article of articles) {
        try {
          const tweetData = this.articleToTweetData(article);
          const tweetResult = await xApiService.postTweet(tweetData);

          // Log the attempt
          await this.logShareAttempt({
            articleId: article.id,
            articleTitle: article.title,
            tweetId: tweetResult.tweetId,
            success: tweetResult.success,
            error: tweetResult.error,
            sharedAt: Timestamp.now()
          });

          if (tweetResult.success) {
            // Update article status
            await this.updateArticleShareStatus(article.id, true, tweetResult.tweetId);
            result.articlesShared++;
            
            console.log(`Successfully shared article: ${article.title}`);
            console.log(`Tweet ID: ${tweetResult.tweetId}`);
          } else {
            result.errors.push(`Failed to share "${article.title}": ${tweetResult.error}`);
            
            // Update article status as failed
            await this.updateArticleShareStatus(article.id, false);

            // Check for rate limit
            if (tweetResult.error?.includes('Rate limit')) {
              result.rateLimitHit = true;
              break; // Stop sharing if rate limited
            }
          }

          // Add delay between posts to avoid rate limiting
          if (articles.indexOf(article) < articles.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
          }

        } catch (error: any) {
          const errorMsg = `Error sharing article "${article.title}": ${error.message}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);

          // Log failed attempt
          await this.logShareAttempt({
            articleId: article.id,
            articleTitle: article.title,
            success: false,
            error: error.message,
            sharedAt: Timestamp.now()
          });
        }
      }

      // Set overall success based on whether any articles were shared
      result.success = result.articlesShared > 0 || result.errors.length === 0;

    } catch (error: any) {
      result.success = false;
      result.errors.push(`General error: ${error.message}`);
      console.error('Error in shareArticles:', error);
    }

    return result;
  }

  /**
   * Get sharing statistics
   */
  async getShareStats(): Promise<{
    todayShares: number;
    remainingShares: number;
    totalShares: number;
  }> {
    try {
      const todayShares = await this.getTodayShareCount();
      
      // Get total shares
      const logsRef = collection(db, this.COLLECTION_X_LOGS);
      const totalQuery = query(logsRef, where('success', '==', true));
      const totalSnapshot = await getDocs(totalQuery);
      
      return {
        todayShares,
        remainingShares: Math.max(0, this.DAILY_SHARE_LIMIT - todayShares),
        totalShares: totalSnapshot.size
      };
    } catch (error) {
      console.error('Error getting share stats:', error);
      return {
        todayShares: 0,
        remainingShares: this.DAILY_SHARE_LIMIT,
        totalShares: 0
      };
    }
  }

  /**
   * Test X API connection
   */
  async testConnection() {
    return await xApiService.testConnection();
  }
}

// Export singleton instance
export const xAutoShareService = new XAutoShareService();
export type { ShareResult, ShareLog };
