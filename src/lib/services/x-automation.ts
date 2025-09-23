import { xAutoShareService } from './x-auto-share';

interface XAutomationConfig {
  enabled: boolean;
  dailyShareLimit: number;
  shareInterval: number; // minutes between shares
  minArticleAge: number; // minutes - minimum age before sharing
  maxArticleAge: number; // hours - maximum age for sharing
}

interface XAutomationStats {
  todayShares: number;
  remainingShares: number;
  totalShares: number;
  lastShareTime?: Date;
  nextShareTime?: Date;
  isRunning: boolean;
}

class XAutomationService {
  private config: XAutomationConfig;
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;
  private lastShareTime?: Date;

  constructor() {
    this.config = {
      enabled: true,
      dailyShareLimit: 4, // Conservative limit for free tier
      shareInterval: 360, // 6 hours between shares (4 times per day)
      minArticleAge: 30, // Wait 30 minutes after publishing
      maxArticleAge: 24 // Don't share articles older than 24 hours
    };
  }

  /**
   * Start the X automation service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('🐦 X automation is already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('🐦 X automation is disabled');
      return;
    }

    console.log('🐦 Starting X automation service...');
    this.isRunning = true;

    // Run immediately on start
    await this.runShareCycle();

    // Set up interval for regular sharing
    this.intervalId = setInterval(async () => {
      await this.runShareCycle();
    }, this.config.shareInterval * 60 * 1000); // Convert minutes to milliseconds

    console.log(`🐦 X automation started - will share every ${this.config.shareInterval} minutes`);
  }

  /**
   * Stop the X automation service
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('🐦 X automation is not running');
      return;
    }

    console.log('🐦 Stopping X automation service...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    console.log('🐦 X automation stopped');
  }

  /**
   * Run a single share cycle
   */
  private async runShareCycle(): Promise<void> {
    try {
      console.log('🐦 Running X share cycle...');

      // Check if we can share more articles today
      const stats = await xAutoShareService.getShareStats();
      
      if (stats.remainingShares <= 0) {
        console.log('🐦 Daily share limit reached, skipping cycle');
        return;
      }

      // Check if enough time has passed since last share
      if (this.lastShareTime) {
        const timeSinceLastShare = Date.now() - this.lastShareTime.getTime();
        const minInterval = this.config.shareInterval * 60 * 1000; // Convert to milliseconds
        
        if (timeSinceLastShare < minInterval) {
          const remainingTime = Math.ceil((minInterval - timeSinceLastShare) / (60 * 1000));
          console.log(`🐦 Too soon to share again, waiting ${remainingTime} more minutes`);
          return;
        }
      }

      // Attempt to share articles
      const result = await xAutoShareService.shareArticles();
      
      if (result.success && result.articlesShared > 0) {
        this.lastShareTime = new Date();
        console.log(`🐦 Successfully shared ${result.articlesShared} articles`);
      } else if (result.errors.length > 0) {
        console.log('🐦 Share cycle completed with errors:', result.errors);
      } else {
        console.log('🐦 No articles available to share');
      }

      // If rate limited, increase interval temporarily
      if (result.rateLimitHit) {
        console.log('🐦 Rate limit hit, will wait longer before next attempt');
      }

    } catch (error) {
      console.error('🐦 Error in X share cycle:', error);
    }
  }

  /**
   * Force share articles immediately
   */
  async forceShare(): Promise<any> {
    console.log('🐦 Force sharing articles...');
    
    const result = await xAutoShareService.shareArticles();
    
    if (result.success && result.articlesShared > 0) {
      this.lastShareTime = new Date();
    }
    
    return result;
  }

  /**
   * Get automation statistics
   */
  async getStats(): Promise<XAutomationStats> {
    const shareStats = await xAutoShareService.getShareStats();
    
    // Calculate next share time
    let nextShareTime: Date | undefined;
    if (this.lastShareTime && this.isRunning) {
      nextShareTime = new Date(
        this.lastShareTime.getTime() + (this.config.shareInterval * 60 * 1000)
      );
    }

    return {
      todayShares: shareStats.todayShares,
      remainingShares: shareStats.remainingShares,
      totalShares: shareStats.totalShares,
      lastShareTime: this.lastShareTime,
      nextShareTime,
      isRunning: this.isRunning
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<XAutomationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🐦 X automation config updated:', this.config);

    // Restart if running to apply new interval
    if (this.isRunning) {
      this.stop();
      setTimeout(() => this.start(), 1000);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): XAutomationConfig {
    return { ...this.config };
  }

  /**
   * Check if automation is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Test X API connection
   */
  async testConnection(): Promise<any> {
    return await xAutoShareService.testConnection();
  }

  /**
   * Get time until next share
   */
  getTimeUntilNextShare(): string {
    if (!this.isRunning || !this.lastShareTime) {
      return 'Not scheduled';
    }

    const nextShareTime = new Date(
      this.lastShareTime.getTime() + (this.config.shareInterval * 60 * 1000)
    );
    
    const now = new Date();
    const timeDiff = nextShareTime.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
      return 'Ready to share';
    }
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Get optimal sharing times for the day
   */
  getOptimalSharingTimes(): Date[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Optimal times: 8:00, 12:00, 16:00, 20:00
    const optimalHours = [8, 12, 16, 20];
    
    return optimalHours.map(hour => {
      const time = new Date(today);
      time.setHours(hour, 0, 0, 0);
      return time;
    });
  }
}

// Export singleton instance
export const xAutomationService = new XAutomationService();
export type { XAutomationConfig, XAutomationStats };
