/**
 * Trend Tracker Service
 * Tracks new trending topics and triggers article generation
 */

import { TrendingTopic } from './google-trends';

export interface TrackedTrend {
  id: string;
  title: string;
  slug: string;
  category: string;
  formattedTraffic: string;
  traffic: number;
  searchVolume?: number; // For proper sorting by search volume
  source: string;
  firstSeen: string;
  lastSeen: string;
  articleGenerated: boolean;
  articleId?: string;
  hash: string; // For duplicate detection
}

export interface TrendTrackingStats {
  totalTrends: number;
  newTrends: number;
  articlesGenerated: number;
  duplicatesFiltered: number;
  lastUpdate: string;
}

class TrendTracker {
  private readonly STORAGE_KEY = 'trend_tracker_data';
  private readonly MAX_STORED_TRENDS = 1000; // Keep last 1000 trends

  /**
   * Process new trending topics and identify which ones need articles
   */
  async processNewTrends(topics: TrendingTopic[], source: string): Promise<{
    newTrends: TrackedTrend[];
    stats: TrendTrackingStats;
  }> {
    const existingTrends = await this.getStoredTrends();
    const newTrends: TrackedTrend[] = [];
    let duplicatesFiltered = 0;

    console.log(`📊 Processing ${topics.length} topics from ${source}...`);

    for (const topic of topics) {
      const trendHash = this.generateTrendHash(topic);
      const existingTrend = existingTrends.find(t => t.hash === trendHash);

      if (existingTrend) {
        // Update last seen time for existing trend
        existingTrend.lastSeen = new Date().toISOString();
        duplicatesFiltered++;
        continue;
      }

      // This is a new trend
      const newTrend: TrackedTrend = {
        id: this.generateTrendId(topic),
        title: topic.title,
        slug: this.generateSlug(topic.title),
        category: topic.category,
        formattedTraffic: topic.formattedTraffic || topic.traffic,
        traffic: this.parseTrafficValue(topic.formattedTraffic || topic.traffic),
        source,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        articleGenerated: false,
        hash: trendHash
      };

      newTrends.push(newTrend);
      existingTrends.push(newTrend);
    }

    // Clean up old trends (keep only recent ones)
    const cleanedTrends = this.cleanupOldTrends(existingTrends);
    await this.storeTrackedTrends(cleanedTrends);

    const stats: TrendTrackingStats = {
      totalTrends: cleanedTrends.length,
      newTrends: newTrends.length,
      articlesGenerated: 0, // Will be updated after article generation
      duplicatesFiltered,
      lastUpdate: new Date().toISOString()
    };

    console.log(`✅ Trend processing complete: ${newTrends.length} new trends, ${duplicatesFiltered} duplicates filtered`);

    return { newTrends, stats };
  }

  /**
   * Mark trend as having article generated
   */
  async markArticleGenerated(trendId: string, articleId: string): Promise<void> {
    const trends = await this.getStoredTrends();
    const trend = trends.find(t => t.id === trendId);

    if (trend) {
      trend.articleGenerated = true;
      trend.articleId = articleId;
      await this.storeTrackedTrends(trends);
      console.log(`✅ Marked trend "${trend.title}" as having article generated: ${articleId}`);
    }
  }

  /**
   * Get trends that need articles generated
   */
  getTrendsNeedingArticles(): TrackedTrend[] {
    const trends = this.getStoredTrends();
    return trends.filter(t => !t.articleGenerated);
  }

  /**
   * Get trending statistics
   */
  getTrendingStats(): TrendTrackingStats {
    const trends = this.getStoredTrends();
    const articlesGenerated = trends.filter(t => t.articleGenerated).length;
    
    return {
      totalTrends: trends.length,
      newTrends: 0, // This would be calculated during processing
      articlesGenerated,
      duplicatesFiltered: 0, // This would be calculated during processing
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Generate unique hash for trend (for duplicate detection)
   */
  private generateTrendHash(topic: TrendingTopic): string {
    const normalized = topic.title.toLowerCase().trim().replace(/[^\w\s]/g, '');
    return Buffer.from(normalized).toString('base64').substring(0, 16);
  }

  /**
   * Generate unique trend ID
   */
  private generateTrendId(topic: TrendingTopic): string {
    const timestamp = Date.now();
    const hash = this.generateTrendHash(topic);
    return `trend_${timestamp}_${hash}`;
  }

  /**
   * Generate URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Parse traffic value from formatted string
   */
  private parseTrafficValue(formattedTraffic: string): number {
    if (!formattedTraffic) return 0;
    
    const cleanValue = formattedTraffic.replace(/[+,\s]/g, '').toLowerCase();
    const numMatch = cleanValue.match(/^(\d+(?:\.\d+)?)/);
    
    if (!numMatch) return 0;
    
    const num = parseFloat(numMatch[1]);
    
    if (cleanValue.includes('m')) return num * 1000000;
    if (cleanValue.includes('k')) return num * 1000;
    
    return num;
  }

  /**
   * Clean up old trends to prevent storage bloat
   */
  private cleanupOldTrends(trends: TrackedTrend[]): TrackedTrend[] {
    // Sort by last seen (most recent first)
    const sorted = trends.sort((a, b) => 
      new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
    );

    // Keep only the most recent trends
    return sorted.slice(0, this.MAX_STORED_TRENDS);
  }

  /**
   * Get stored trends from localStorage/Firebase
   */
  private async getStoredTrends(): Promise<TrackedTrend[]> {
    try {
      if (typeof window !== 'undefined') {
        // Client-side: use localStorage
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
      } else {
        // Server-side: use Firebase instead of file system
        try {
          const { firebaseTrendsService } = await import('./firebase-trends');
          const trends = await firebaseTrendsService.getLatestTrends(this.MAX_STORED_TRENDS);
          return trends.map((trend: any) => ({
            id: trend.id,
            title: trend.title || trend.keyword,
            slug: trend.slug || (trend.title || trend.keyword).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            category: trend.category || 'General',
            formattedTraffic: trend.formattedTraffic || trend.traffic?.toString() || '0',
            traffic: typeof trend.traffic === 'number' ? trend.traffic : parseInt(trend.traffic?.toString().replace(/[^0-9]/g, '') || '0'),
            source: trend.source || 'firebase',
            firstSeen: trend.firstSeen || trend.createdAt || new Date().toISOString(),
            lastSeen: trend.lastSeen || trend.updatedAt || new Date().toISOString(),
            articleGenerated: trend.articleGenerated || false,
            articleId: trend.articleId,
            hash: trend.hash || this.generateTrendHash({ title: trend.title || trend.keyword, category: trend.category || 'General' })
          }));
        } catch (firebaseError) {
          console.warn('Firebase trends not available, using empty array:', firebaseError);
          return [];
        }
      }
    } catch (error) {
      console.error('Error loading stored trends:', error);
      return [];
    }
  }

  /**
   * Store trends to localStorage/Firebase
   */
  private async storeTrackedTrends(trends: TrackedTrend[]): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        // Client-side: use localStorage
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trends));
      } else {
        // Server-side: Firebase storage is handled by firebase-trends service
        // We don't need to store here as trends are already in Firebase
        console.log(`📊 Trends tracking: ${trends.length} trends processed (stored in Firebase)`);
      }
    } catch (error) {
      console.error('Error storing trends:', error);
    }
  }

  /**
   * Clear all stored trends (for testing/reset)
   */
  clearStoredTrends(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.STORAGE_KEY);
      }
      console.log('✅ Stored trends cleared');
    } catch (error) {
      console.error('Error clearing trends:', error);
    }
  }

  /**
   * Get recent trends for display
   */
  getRecentTrends(limit: number = 50): TrackedTrend[] {
    const trends = this.getStoredTrends();
    return trends
      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
      .slice(0, limit);
  }

  /**
   * Get all stored trends
   */
  getAllTrends(): TrackedTrend[] {
    return this.getStoredTrends();
  }
}

export const trendTracker = new TrendTracker();
export default trendTracker;
