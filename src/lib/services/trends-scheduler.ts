/**
 * Trends Scheduler Service
 * Manages 6x daily trend updates and article generation
 */

import { googleTrendsService } from './google-trends';
import { firebaseTrendsService } from './firebase-trends';
import { automatedArticleGenerator } from './automated-article-generator';

export interface ArticleGenerationQueue {
  currentlyGenerating: {
    trend: any;
    startedAt: string;
    estimatedCompletion: string;
  } | null;
  queuedArticles: Array<{
    trend: any;
    scheduledFor: string;
    position: number;
  }>;
  totalInBatch: number;
  completedInBatch: number;
  batchStartedAt: string | null;
}

export interface SchedulerStats {
  isRunning: boolean;
  lastUpdate: string | null;
  nextUpdate: string | null;
  updatesPerDay: number;
  totalUpdates: number;
  trendsCollected: number;
  articlesGenerated: number;
  dailyUpdateCount?: number;
  remainingUpdates?: number;
  activeHours?: string;
  articleGeneration?: ArticleGenerationQueue;
}

class TrendsScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly UPDATES_PER_DAY = 6;
  private readonly ACTIVE_HOURS_START = 6; // 6:00 AM
  private readonly ACTIVE_HOURS_END = 22; // 10:00 PM
  private readonly CHECK_INTERVAL = 30 * 60 * 1000; // Check every 30 minutes

  // Calculate update interval: 16 hours (6:00-22:00) / 6 updates = ~2.67 hours
  private readonly UPDATE_INTERVAL = Math.floor((16 * 60 * 60 * 1000) / 6); // ~2.67 hours
  
  private stats: SchedulerStats = {
    isRunning: false,
    lastUpdate: null,
    nextUpdate: null,
    updatesPerDay: this.UPDATES_PER_DAY,
    totalUpdates: 0,
    trendsCollected: 0,
    articlesGenerated: 0
  };

  private dailyUpdateCount: number = 0;
  private lastUpdateDate: string = '';

  // Article generation queue management
  private articleGenerationQueue: ArticleGenerationQueue = {
    currentlyGenerating: null,
    queuedArticles: [],
    totalInBatch: 0,
    completedInBatch: 0,
    batchStartedAt: null
  };
  private articleGenerationTimeouts: NodeJS.Timeout[] = [];

  /**
   * Start the trends scheduler with smart timing (6:00-22:00, 6x daily)
   */
  start(): void {
    if (this.intervalId) {
      console.log('⚠️ Trends scheduler is already running');
      return;
    }

    console.log('🚀 Starting smart trends scheduler (6x daily, 6:00-22:00)');

    // Initialize daily counter
    this.resetDailyCounterIfNeeded();

    // Run immediately if within active hours and haven't reached daily limit
    if (this.shouldUpdateNow()) {
      this.updateTrends();
    }

    // Schedule regular checks every 30 minutes
    this.intervalId = setInterval(() => {
      this.checkAndUpdate();
    }, this.CHECK_INTERVAL);

    this.stats.isRunning = true;
    this.updateNextUpdateTime();
  }

  /**
   * Stop the trends scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.stats.isRunning = false;

      // Clear all article generation timeouts
      this.articleGenerationTimeouts.forEach(timeout => clearTimeout(timeout));
      this.articleGenerationTimeouts = [];
      this.clearArticleQueue();

      console.log('⏹️ Trends scheduler stopped');
    }
  }

  /**
   * Force update trends now
   */
  async forceUpdate(): Promise<void> {
    console.log('🔄 Force updating trends...');
    await this.updateTrends();
  }

  /**
   * Get scheduler statistics
   */
  getStats(): SchedulerStats {
    this.resetDailyCounterIfNeeded();

    return {
      ...this.stats,
      dailyUpdateCount: this.dailyUpdateCount,
      remainingUpdates: Math.max(0, this.UPDATES_PER_DAY - this.dailyUpdateCount),
      activeHours: `${this.ACTIVE_HOURS_START}:00-${this.ACTIVE_HOURS_END}:00`,
      articleGeneration: { ...this.articleGenerationQueue }
    };
  }

  /**
   * Check if we should update now based on time and daily limits
   */
  private shouldUpdateNow(): boolean {
    const now = new Date();
    const currentHour = now.getHours();

    // Check if within active hours (6:00-22:00)
    if (currentHour < this.ACTIVE_HOURS_START || currentHour >= this.ACTIVE_HOURS_END) {
      return false;
    }

    // Check daily limit
    if (this.dailyUpdateCount >= this.UPDATES_PER_DAY) {
      return false;
    }

    // Check if enough time has passed since last update
    if (this.stats.lastUpdate) {
      const lastUpdate = new Date(this.stats.lastUpdate);
      const timeSinceLastUpdate = now.getTime() - lastUpdate.getTime();

      // Minimum 2 hours between updates
      if (timeSinceLastUpdate < (2 * 60 * 60 * 1000)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check and update if conditions are met
   */
  private checkAndUpdate(): void {
    this.resetDailyCounterIfNeeded();

    if (this.shouldUpdateNow()) {
      console.log(`📅 Scheduled update triggered (${this.dailyUpdateCount + 1}/${this.UPDATES_PER_DAY} today)`);
      this.updateTrends();
    }
  }

  /**
   * Reset daily counter if it's a new day
   */
  private resetDailyCounterIfNeeded(): void {
    const today = new Date().toISOString().split('T')[0];

    if (this.lastUpdateDate !== today) {
      this.dailyUpdateCount = 0;
      this.lastUpdateDate = today;
      console.log(`📅 New day detected, reset daily update counter`);
    }
  }

  /**
   * Main update function - fetches trends and saves to Firebase
   */
  private async updateTrends(): Promise<void> {
    try {
      // Double-check we should update (safety check)
      if (!this.shouldUpdateNow()) {
        console.log('⏭️ Skipping update - conditions not met');
        return;
      }

      console.log(`📊 Starting scheduled trends update (${this.dailyUpdateCount + 1}/${this.UPDATES_PER_DAY} today)...`);

      // Fetch latest trends from SerpAPI + RSS
      const trendsData = await googleTrendsService.getDailyTrends('US');

      if (!trendsData.topics || trendsData.topics.length === 0) {
        console.log('⚠️ No trends data received, skipping update');
        return;
      }

      // Save trends to Firebase
      const batchId = await firebaseTrendsService.saveTrendsBatch(trendsData.topics);

      // Update counters and stats
      this.dailyUpdateCount++;
      this.stats.lastUpdate = new Date().toISOString();
      this.stats.totalUpdates++;
      this.stats.trendsCollected += trendsData.topics.length;
      this.updateNextUpdateTime();

      console.log(`✅ Trends update completed: ${trendsData.topics.length} trends saved (batch: ${batchId})`);
      console.log(`📈 Daily progress: ${this.dailyUpdateCount}/${this.UPDATES_PER_DAY} updates completed`);

      // Note: Article generation is handled separately by Automation Service
      console.log(`📝 Trends collection complete. Article generation is managed by Automation Service.`);

    } catch (error) {
      console.error('❌ Error during trends update:', error);
    }
  }

  /**
   * Generate articles from trends that need articles
   */
  private async generateArticlesFromTrends(): Promise<void> {
    try {
      console.log('📝 Checking for trends needing articles...');
      
      // Get 6 trends with highest search volume
      const trendsNeedingArticles = await firebaseTrendsService.getTrendsNeedingArticles(6);
      
      if (trendsNeedingArticles.length === 0) {
        console.log('✅ No trends need articles at this time');
        return;
      }

      // Clear any existing queue
      this.clearArticleQueue();

      // Initialize batch
      this.articleGenerationQueue.totalInBatch = Math.min(6, trendsNeedingArticles.length);
      this.articleGenerationQueue.completedInBatch = 0;
      this.articleGenerationQueue.batchStartedAt = new Date().toISOString();

      console.log(`📋 Queued ${this.articleGenerationQueue.totalInBatch} articles for generation`);

      // Generate first article immediately
      if (trendsNeedingArticles.length > 0) {
        await this.generateSingleArticle(trendsNeedingArticles[0], 0);
      }

      // Schedule remaining articles (every 10 minutes)
      for (let i = 1; i < Math.min(6, trendsNeedingArticles.length); i++) {
        const trend = trendsNeedingArticles[i];
        const scheduledTime = new Date(Date.now() + (i * 10 * 60 * 1000));

        // Add to queue
        this.articleGenerationQueue.queuedArticles.push({
          trend,
          scheduledFor: scheduledTime.toISOString(),
          position: i + 1
        });

        // Schedule generation
        const timeout = setTimeout(async () => {
          await this.generateSingleArticle(trend, i);
        }, i * 10 * 60 * 1000);

        this.articleGenerationTimeouts.push(timeout);

        console.log(`⏰ Scheduled article ${i + 1}/6 for ${scheduledTime.toLocaleTimeString()}: "${trend.keyword}"`);
      }

    } catch (error) {
      console.error('❌ Error setting up article generation batch:', error);
    }
  }

  // Generate a single article and update queue
  private generateSingleArticle = async (trend: any, position: number): Promise<void> => {
    try {
      // Update current generation status
      this.articleGenerationQueue.currentlyGenerating = {
        trend,
        startedAt: new Date().toISOString(),
        estimatedCompletion: new Date(Date.now() + 3 * 60 * 1000).toISOString() // 3 minutes estimate
      };

      // Remove from queued articles if it was there
      this.articleGenerationQueue.queuedArticles = this.articleGenerationQueue.queuedArticles.filter(
        item => item.trend.id !== trend.id
      );

      console.log(`🎯 Generating article ${position + 1}/${this.articleGenerationQueue.totalInBatch}: "${trend.keyword}"`);

      // Check if this exact trend already has an article generated
      if (trend.articleGenerated) {
        console.log(`⏭️ Skipping "${trend.keyword}" - already has article generated`);
        this.completeArticleGeneration();
        return;
      }

      const articleJob = await automatedArticleGenerator.generateArticleFromTrend({
        topic: trend.title,
        keyword: trend.keyword,
        category: trend.category,
        traffic: trend.traffic,
        searchVolume: trend.searchVolume,
        confidence: trend.confidence,
        sources: trend.sources || []
      });

      if (articleJob && articleJob.articleId && articleJob.status === 'completed' && trend.id) {
        // Mark trend as having article generated
        await firebaseTrendsService.markTrendAsGenerated(trend.id, articleJob.articleId);
        this.stats.articlesGenerated++;

        console.log(`✅ Article ${position + 1}/${this.articleGenerationQueue.totalInBatch} generated: "${trend.keyword}" → ${articleJob.articleId}`);
      } else {
        console.log(`❌ Failed to generate article for "${trend.keyword}" - Status: ${articleJob?.status || 'unknown'}`);
      }

      this.completeArticleGeneration();

    } catch (error) {
      console.error(`❌ Error generating article for "${trend.keyword}":`, error);
      this.completeArticleGeneration();
    }
  }

  // Complete current article generation and update counters
  private completeArticleGeneration = (): void => {
    this.articleGenerationQueue.currentlyGenerating = null;
    this.articleGenerationQueue.completedInBatch++;

    const remaining = this.articleGenerationQueue.totalInBatch - this.articleGenerationQueue.completedInBatch;
    console.log(`📊 Batch progress: ${this.articleGenerationQueue.completedInBatch}/${this.articleGenerationQueue.totalInBatch} completed, ${remaining} remaining`);

    // If batch is complete, keep the queue for 5 minutes for monitoring
    if (this.articleGenerationQueue.completedInBatch >= this.articleGenerationQueue.totalInBatch) {
      console.log('🎉 Article generation batch completed! Keeping queue visible for 5 minutes.');

      // Clear the queue after 5 minutes
      setTimeout(() => {
        console.log('🧹 Clearing completed article generation queue');
        this.clearArticleQueue();
      }, 5 * 60 * 1000); // 5 minutes
    }
  }

  // Clear article generation queue
  private clearArticleQueue = (): void => {
    this.articleGenerationQueue = {
      currentlyGenerating: null,
      queuedArticles: [],
      totalInBatch: 0,
      completedInBatch: 0,
      batchStartedAt: null
    };
  }

  /**
   * Update next update time based on smart scheduling
   */
  private updateNextUpdateTime(): void {
    if (!this.stats.isRunning) {
      this.stats.nextUpdate = null;
      return;
    }

    const now = new Date();
    let nextUpdate = new Date(now);

    // If we've reached daily limit, next update is tomorrow at 6:00 AM
    if (this.dailyUpdateCount >= this.UPDATES_PER_DAY) {
      nextUpdate.setDate(nextUpdate.getDate() + 1);
      nextUpdate.setHours(this.ACTIVE_HOURS_START, 0, 0, 0);
    } else {
      // Calculate next update time within active hours
      const remainingUpdates = this.UPDATES_PER_DAY - this.dailyUpdateCount;
      const currentHour = now.getHours();

      if (currentHour < this.ACTIVE_HOURS_START) {
        // Before active hours - next update at 6:00 AM
        nextUpdate.setHours(this.ACTIVE_HOURS_START, 0, 0, 0);
      } else if (currentHour >= this.ACTIVE_HOURS_END) {
        // After active hours - next update tomorrow at 6:00 AM
        nextUpdate.setDate(nextUpdate.getDate() + 1);
        nextUpdate.setHours(this.ACTIVE_HOURS_START, 0, 0, 0);
      } else {
        // Within active hours - calculate optimal next update time
        const remainingHours = this.ACTIVE_HOURS_END - currentHour;
        const hoursPerUpdate = remainingHours / remainingUpdates;
        const nextUpdateHours = Math.max(2, hoursPerUpdate); // Minimum 2 hours between updates

        nextUpdate = new Date(now.getTime() + (nextUpdateHours * 60 * 60 * 1000));

        // Ensure next update is within active hours
        if (nextUpdate.getHours() >= this.ACTIVE_HOURS_END) {
          nextUpdate.setDate(nextUpdate.getDate() + 1);
          nextUpdate.setHours(this.ACTIVE_HOURS_START, 0, 0, 0);
        }
      }
    }

    this.stats.nextUpdate = nextUpdate.toISOString();
  }

  /**
   * Get time until next update
   */
  getTimeUntilNextUpdate(): number {
    if (!this.stats.nextUpdate) return 0;
    return Math.max(0, new Date(this.stats.nextUpdate).getTime() - Date.now());
  }

  /**
   * Get human readable time until next update
   */
  getTimeUntilNextUpdateFormatted(): string {
    const ms = this.getTimeUntilNextUpdate();
    if (ms === 0) return 'Not scheduled';
    
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}

export const trendsScheduler = new TrendsScheduler();
