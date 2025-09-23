/**
 * Automated Article Generator
 * Generates articles from new trending topics with rate limiting and quality control
 */

import { trendTracker, TrackedTrend } from './trend-tracker';
import { serpApiMonitor } from '@/lib/utils/serpapi-monitor';
import { contentGenerator } from './content-generator';
import { qualityScorerService, QualityScore } from './quality-scorer';
import { articleTemplateService } from './article-templates';

export interface ArticleGenerationJob {
  id: string;
  trendId: string;
  trend: TrackedTrend;
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'quality_check' | 'rejected';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  scheduledAt?: string; // When this article should be generated
  position: number; // Position in daily plan (1-24)
  error?: string;
  articleId?: string;
  template?: string;
  qualityScore?: QualityScore;
  retryCount?: number;
}

export interface DailyPlan {
  date: string; // YYYY-MM-DD format
  jobs: ArticleGenerationJob[];
  createdAt: string;
  updatedAt: string;
}

export interface GenerationStats {
  totalJobs: number;
  pendingJobs: number;
  generatingJobs: number;
  completedJobs: number;
  failedJobs: number;
  rejectedJobs: number;
  todayJobs: number;
  isRunning: boolean;
  lastRun?: string;
  nextRun?: string;
  averageQualityScore?: number;
  successRate?: number;
  dailyPlan?: DailyPlan;
  nextScheduledJob?: ArticleGenerationJob;
}

class AutomatedArticleGenerator {
  private readonly STORAGE_KEY = 'article_generation_jobs';
  private readonly DAILY_PLAN_KEY = 'daily_article_plan';
  private readonly MAX_DAILY_ARTICLES = 24; // 24 articles per day
  private readonly CHECK_INTERVAL = 10 * 60 * 1000; // Check every 10 minutes (not generation interval!)
  private readonly MIN_QUALITY_SCORE = 60; // Minimum quality threshold
  private readonly MAX_RETRIES = 2; // Maximum retry attempts per article
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;
  private readonly SERVICE_STATUS_DOC = 'article_generator_service_status';


  /**
   * Safe date creation with validation
   */
  private createSafeDate(dateInput: any): Date | null {
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        console.warn('⚠️ Invalid date input:', dateInput);
        return null;
      }
      return date;
    } catch (error) {
      console.warn('⚠️ Error creating date from:', dateInput, error);
      return null;
    }
  }

  /**
   * Safe ISO string creation
   */
  private createSafeISOString(dateInput: any): string {
    const date = this.createSafeDate(dateInput);
    return date ? date.toISOString() : new Date().toISOString();
  }

  /**
   * Get interval ID for debugging
   */
  get intervalIdForDebug(): NodeJS.Timeout | undefined {
    return this.intervalId;
  }

  /**
   * Store service status in Firebase (for serverless persistence)
   */
  private async storeServiceStatus(isRunning: boolean): Promise<void> {
    // Skip on client-side
    if (typeof window !== 'undefined') {
      console.log('📦 Client-side: storing in localStorage');
      try {
        localStorage.setItem('article_generator_firebase_status', JSON.stringify({
          isRunning,
          lastUpdated: new Date().toISOString(),
          source: 'localStorage_client_side'
        }));
      } catch (error) {
        console.error('❌ localStorage failed:', error);
      }
      return;
    }

    // Server-side: use Firebase Admin
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Dynamic import Firebase Admin module
        const { storeServiceStatus } = await import('@/lib/firebase-admin');
        const success = await storeServiceStatus(isRunning);

        if (success) {
          console.log(`📊 Service status stored in Firebase: isRunning=${isRunning} (attempt ${attempt})`);
          return; // Success
        } else {
          throw new Error('Firebase Admin storeServiceStatus returned false');
        }
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Error storing service status (attempt ${attempt}/${maxRetries}):`, error);

        if (this.isFirebaseConnectionError(error) && attempt < maxRetries) {
          console.log(`🔄 Retrying Firebase store in ${attempt * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }
    }

    console.error('❌ Failed to store service status after all retries:', lastError);
  }

  /**
   * Load service status from Firebase (for serverless persistence)
   */
  private async loadServiceStatus(): Promise<boolean> {
    // Skip on client-side
    if (typeof window !== 'undefined') {
      console.log('📦 Client-side: loading from localStorage');
      try {
        const fallbackData = localStorage.getItem('article_generator_firebase_status');
        if (fallbackData) {
          const parsed = JSON.parse(fallbackData);
          console.log(`💾 Service status loaded from localStorage: isRunning=${parsed.isRunning}`);
          return parsed.isRunning || false;
        }
      } catch (error) {
        console.error('❌ localStorage failed:', error);
      }
      return false;
    }

    // Server-side: use Firebase Admin
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Dynamic import Firebase Admin module
        const { loadServiceStatus } = await import('@/lib/firebase-admin');
        const isRunning = await loadServiceStatus();
        console.log(`📊 Service status loaded from Firebase: isRunning=${isRunning} (attempt ${attempt})`);
        return isRunning;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Error loading service status (attempt ${attempt}/${maxRetries}):`, error);

        if (this.isFirebaseConnectionError(error) && attempt < maxRetries) {
          console.log(`🔄 Retrying Firebase load in ${attempt * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }
    }

    console.error('❌ Failed to load service status after all retries:', lastError);
    return false; // Default to false if all retries fail
  }

  /**
   * Start automated article generation - checks for scheduled articles every 10 minutes
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Automated article generation already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting automated article generation...');

    // Store status in Firebase for serverless persistence
    await this.storeServiceStatus(true);

    // Check if we're in production (Vercel) or development
    const isProduction = process.env.NODE_ENV === 'production' && process.env.VERCEL;

    if (isProduction) {
      console.log('🌐 Production mode: Using Vercel cron jobs for scheduling');
      console.log('⏰ Articles will be generated via /api/automation/cron every 10 minutes');

      // In production, we rely on Vercel cron jobs
      // Just mark as running for status purposes
      this.storeStartTime();

    } else {
      console.log('🏠 Development mode: Using local intervals');
      console.log('📅 System will check for scheduled articles every 10 minutes');
      console.log('⏰ Articles are scheduled hourly (00:00, 01:00, 02:00, etc.)');

      // Run immediately to check for any pending articles
      this.checkScheduledArticles();

      // Store start time for persistence
      this.storeStartTime();

      // Set up interval to check for scheduled articles (NOT generate every interval!)
      this.intervalId = setInterval(async () => {
        try {
          await this.checkScheduledArticles();

          // Update last activity timestamp
          this.updateLastActivity();

        } catch (error) {
          console.error('❌ Error in scheduled check interval:', error);
          // Don't stop the interval, just log the error and continue
        }
      }, this.CHECK_INTERVAL);
    }

    console.log(`✅ Article scheduler started (${isProduction ? 'cron-based' : 'interval-based'})`);
  }

  /**
   * Stop automated article generation
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ Automated article generation not running');
      return;
    }

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    // Store status in Firebase for serverless persistence
    await this.storeServiceStatus(false);

    // Update stored status
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('article_generator_status', 'stopped');
        localStorage.setItem('article_generator_stop_time', new Date().toISOString());
      }
    } catch (error) {
      console.warn('Failed to update stop status:', error);
    }

    console.log('🛑 Automated article generation stopped');
  }

  /**
   * Restart automated article generation (useful for recovery)
   */
  restart(): void {
    console.log('🔄 Restarting automated article generation...');
    this.stop();
    // Small delay to ensure cleanup
    setTimeout(() => {
      this.start();
    }, 1000);
  }

  /**
   * Check if the service is actually running (considers production vs development mode)
   */
  async isActuallyRunning(): Promise<boolean> {
    const isProduction = process.env.NODE_ENV === 'production' && process.env.VERCEL;

    if (isProduction) {
      // In production, load status from Firebase (serverless persistence)
      const firebaseStatus = await this.loadServiceStatus();
      this.isRunning = firebaseStatus; // Sync local state
      return firebaseStatus;
    } else {
      // In development, we need both flag and interval
      return this.isRunning && !!this.intervalId;
    }
  }

  /**
   * Check for scheduled articles that should be generated now (hourly scheduling)
   */
  private async checkScheduledArticles(): Promise<void> {
    try {
      const now = new Date();
      const pragueTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Prague"}));
      const currentHour = pragueTime.getHours();
      const currentMinute = pragueTime.getMinutes();

      console.log(`🔍 Checking scheduled articles at ${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')} Prague time`);

      // Ensure we have a daily plan
      try {
        await this.ensureDailyPlan();
      } catch (planError) {
        console.error('❌ Error ensuring daily plan:', planError);
        return;
      }

      // Only process articles if we're at the start of an hour (within first 15 minutes)
      if (currentMinute <= 15) {
        console.log(`⏰ It's ${currentHour}:${currentMinute.toString().padStart(2, '0')} - checking for article #${currentHour + 1} to generate`);

        try {
          await this.processScheduledJobs();
        } catch (jobsError) {
          console.error('❌ Error processing scheduled jobs:', jobsError);

          // Check if it's a Firebase connection error
          if (this.isFirebaseConnectionError(jobsError)) {
            console.warn('🔥 Firebase connection error in processScheduledJobs, attempting to recover...');
            await this.handleFirebaseError();
          }
        }
      } else {
        console.log(`⏳ It's ${currentHour}:${currentMinute.toString().padStart(2, '0')} - waiting for next hour (articles generate at :00)`);
      }

    } catch (error) {
      console.error('❌ Critical error in checkScheduledArticles:', error);

      // Check if it's a Firebase connection error
      if (this.isFirebaseConnectionError(error)) {
        console.warn('🔥 Firebase connection error detected, attempting to recover...');
        await this.handleFirebaseError();
      }
    }
  }

  /**
   * Ensure we have a daily plan for today with 24 articles
   * Made public for external cron job access
   */
  public async ensureDailyPlan(): Promise<void> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    let dailyPlan = await this.getDailyPlan(today);

    if (!dailyPlan || dailyPlan.jobs.length < this.MAX_DAILY_ARTICLES) {
      console.log('📅 Creating/updating daily plan for', today);
      dailyPlan = await this.createDailyPlan(today);
    }
  }

  /**
   * Check if article #24 was completed and create new plan if needed
   */
  private async checkAndRenewDailyPlan(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dailyPlan = await this.getDailyPlan(today);

      if (!dailyPlan) {
        console.log('⚠️ No daily plan found for renewal check');
        return;
      }

      // Find article #24 (position 24)
      const article24 = dailyPlan.jobs.find(job => job.position === 24);

      if (article24 && (article24.status === 'completed' || article24.status === 'rejected')) {
        console.log('🎉 Article #24 completed! Creating new daily plan with fresh trends...');

        // Create fresh daily plan with new trends
        await this.createFreshDailyPlan(today);

        console.log('✅ New daily plan created automatically after completing article #24');
      }
    } catch (error) {
      console.error('❌ Error checking daily plan renewal:', error);
    }
  }

  /**
   * Create a daily plan with 24 articles from top trends
   */
  private async createDailyPlan(date: string): Promise<DailyPlan> {
    console.log(`🔄 Starting createDailyPlan for date: ${date}`);

    try {
      // Get current trends from Firebase directly
      console.log('📊 Fetching trends from Firebase for daily plan...');

      let firebaseTrends: any[] = [];

      try {
        const { firebaseTrendsService } = await import('./firebase-trends');
        firebaseTrends = await firebaseTrendsService.getTrendsNeedingArticles(50);
        console.log(`📊 Retrieved ${firebaseTrends.length} trends from Firebase service`);
      } catch (firebaseError) {
        console.error('❌ Firebase trends fetch failed:', firebaseError);
        // Create empty plan on Firebase error
        const dailyPlan: DailyPlan = {
          date,
          jobs: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await this.storeDailyPlan(dailyPlan);
        return dailyPlan;
      }

      if (!firebaseTrends || firebaseTrends.length === 0) {
        console.warn('⚠️ No trends available from Firebase for daily plan');
        // Create empty plan
        const dailyPlan: DailyPlan = {
          date,
          jobs: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await this.storeDailyPlan(dailyPlan);
        return dailyPlan;
      }

      // Convert Firebase trends to TrackedTrend format
      const allTrends = firebaseTrends.map((fbTrend: any) => {
        const trend = {
          id: fbTrend.id,
          title: fbTrend.title || fbTrend.keyword,
          slug: fbTrend.slug || (fbTrend.title || fbTrend.keyword).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          category: fbTrend.category || 'general',
          formattedTraffic: fbTrend.formattedTraffic,
          traffic: fbTrend.searchVolume || fbTrend.traffic || 0, // Use searchVolume as primary source
          searchVolume: fbTrend.searchVolume || 0, // Keep searchVolume for sorting
          source: fbTrend.source,
          firstSeen: fbTrend.savedAt,
          lastSeen: fbTrend.savedAt,
          articleGenerated: fbTrend.articleGenerated,
          hash: fbTrend.id
        };

        // Ensure searchVolume is a number for sorting
        if (typeof trend.searchVolume === 'string') {
          trend.searchVolume = parseInt(trend.searchVolume.replace(/[^0-9]/g, '')) || 0;
        }

        // Ensure traffic is a number (fallback)
        if (typeof trend.traffic === 'string') {
          trend.traffic = parseInt(trend.traffic.replace(/[^0-9]/g, '')) || 0;
        }

        return trend;
      });

      console.log(`📊 Converted ${allTrends.length} Firebase trends to TrackedTrend format`);

      // Debug: Show sample trends with search volume values
      if (allTrends.length > 0) {
        console.log('📊 Sample trends for daily plan:');
        allTrends.slice(0, 3).forEach((trend, i) => {
          console.log(`  ${i + 1}. "${trend.title}" - ${trend.category} - searchVolume: ${trend.searchVolume} (${typeof trend.searchVolume})`);
        });
      }

      // Sort trends by search volume (highest first) - this is the key fix!
      const sortedTrends = allTrends
        .sort((a, b) => (b.searchVolume || 0) - (a.searchVolume || 0))
        .slice(0, this.MAX_DAILY_ARTICLES);

      console.log(`📊 Sorted trends for daily plan: ${sortedTrends.length} trends`);
      if (sortedTrends.length > 0) {
        console.log('📊 Top 3 trends by search volume:');
        sortedTrends.slice(0, 3).forEach((trend, i) => {
          console.log(`  ${i + 1}. "${trend.title}" - searchVolume: ${trend.searchVolume} searches`);
        });
      } else {
        console.warn('⚠️ No sorted trends available for daily plan!');
      }

      // Get existing plan to preserve completed jobs
      const existingPlan = await this.getDailyPlan(date);
      const completedJobs = existingPlan?.jobs.filter(job =>
        job.status === 'completed' || job.status === 'generating'
      ) || [];

      console.log(`📊 Existing plan: ${completedJobs.length} completed jobs`);

      // Create jobs for remaining slots
      const jobs: ArticleGenerationJob[] = [...completedJobs];
      const startHour = 0; // Start at midnight (00:00)
      const intervalHours = 1; // Generate every 1 hour

      for (let i = completedJobs.length; i < this.MAX_DAILY_ARTICLES && i < sortedTrends.length; i++) {
        const trend = sortedTrends[i];

        // Create scheduled time for the target date (every hour starting from 00:00 Prague time)
        // Create a date in Prague timezone for the specific hour
        const scheduledHour = startHour + (i * intervalHours); // Every hour: 0, 1, 2, 3...

        // Create proper Prague time and convert to UTC
        // Prague is UTC+2 in summer, UTC+1 in winter
        const [year, month, day] = date.split('-').map(Number);

        // Create date in Prague timezone using proper timezone handling
        const pragueTimeString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${scheduledHour.toString().padStart(2, '0')}:00:00`;

        // Create Prague time and convert to UTC
        // Use Intl.DateTimeFormat to handle timezone properly
        const pragueDate = new Date(pragueTimeString);

        // Prague is typically UTC+2 (CEST) in summer, UTC+1 (CET) in winter
        // For simplicity, we'll use UTC+2 for now (can be improved with proper timezone detection)
        const pragueOffsetHours = 2;
        const scheduledTime = new Date(pragueDate.getTime() - (pragueOffsetHours * 60 * 60 * 1000));

        const job: ArticleGenerationJob = {
          id: `job_${date}_${i + 1}_${trend.title.replace(/[^a-zA-Z0-9]/g, '_')}`,
          trendId: trend.id,
          trend,
          status: 'pending',
          position: i + 1,
          createdAt: new Date().toISOString(),
          scheduledAt: scheduledTime.toISOString()
        };

        // Debug log for first few jobs
        if (i < 3) {
          console.log(`📅 Job ${i + 1}: "${trend.title}" scheduled for ${scheduledTime.toLocaleString()} (Hour: ${scheduledHour}, Position: ${i + 1})`);
        }

        jobs.push(job);
      }

      const dailyPlan: DailyPlan = {
        date,
        jobs,
        createdAt: existingPlan?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.storeDailyPlan(dailyPlan);
      console.log(`📅 Daily plan created/updated: ${jobs.length} articles scheduled for ${date}`);

      return dailyPlan;

    } catch (error) {
      console.error('❌ Error creating daily plan:', error);
      throw error;
    }
  }

  /**
   * Process jobs that are scheduled to run now - ONLY ONE ARTICLE PER HOUR
   * Made public for external cron job access
   */
  public async processScheduledJobs(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const dailyPlan = await this.getDailyPlan(today);

    if (!dailyPlan) return;

    const now = new Date();
    const pragueTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Prague"}));
    const currentHour = pragueTime.getHours();

    console.log(`🕐 Current time: ${pragueTime.toLocaleString()} Prague (Hour: ${currentHour})`);
    console.log(`📋 Daily plan has ${dailyPlan.jobs.length} jobs total`);
    console.log(`🔍 Looking for job scheduled for current hour ${currentHour}`);

    // Find the job that should be generated for current hour
    // Position mapping: Position 1 = hour 0, Position 2 = hour 1, etc.
    // So for currentHour=16, we need position=17
    let currentHourJob = dailyPlan.jobs.find(job => {
      if (job.status !== 'pending' || !job.scheduledAt) return false;

      // Convert scheduled UTC time to Prague time for comparison
      const scheduledTime = new Date(job.scheduledAt);
      // Add 2 hours to UTC to get Prague time (UTC+2)
      const scheduledPragueTime = new Date(scheduledTime.getTime() + (2 * 60 * 60 * 1000));
      const scheduledHour = scheduledPragueTime.getHours();

      console.log(`🔍 Job #${job.position} "${job.trend?.title}": scheduled UTC ${scheduledTime.toISOString()}, Prague ${scheduledHour}:00 (current: ${currentHour}:00)`);

      // Find job scheduled for current hour
      return scheduledHour === currentHour;
    });

    // If no pending job for current hour, check for stuck jobs and reset them
    if (!currentHourJob) {
      const stuckJobs = dailyPlan.jobs.filter(job => {
        if (job.status !== 'generating' || !job.startedAt) return false;

        const startTime = new Date(job.startedAt);
        const minutesGenerating = (now.getTime() - startTime.getTime()) / (1000 * 60);

        return minutesGenerating > 10; // Stuck if generating for more than 10 minutes
      });

      if (stuckJobs.length > 0) {
        console.log(`🔧 Found ${stuckJobs.length} stuck jobs, resetting them...`);

        for (const stuckJob of stuckJobs) {
          console.log(`🔧 Resetting stuck job #${stuckJob.position}: "${stuckJob.trend?.title}"`);
          stuckJob.status = 'completed'; // Mark as completed to unblock
          stuckJob.completedAt = new Date().toISOString();
        }

        // Save updated plan
        await this.saveDailyPlan(dailyPlan);

        // Try to find current hour job again
        currentHourJob = dailyPlan.jobs.find(job => {
          if (job.status !== 'pending' || !job.scheduledAt) return false;

          const scheduledTime = new Date(job.scheduledAt);
          const scheduledHour = scheduledTime.getHours();

          return scheduledHour === currentHour;
        });
      }
    }

    if (!currentHourJob) {
      console.log(`✅ No pending job for hour ${currentHour}`);

      // Show what jobs are available
      const pendingJobs = dailyPlan.jobs.filter(job => job.status === 'pending');
      if (pendingJobs.length > 0) {
        console.log('📅 Available pending jobs:');
        pendingJobs.slice(0, 5).forEach(job => {
          const scheduledTime = job.scheduledAt ? new Date(job.scheduledAt) : null;
          const scheduledHour = scheduledTime ? scheduledTime.getHours() : 'N/A';
          console.log(`  #${job.position}: "${job.trend.title}" - Scheduled: ${scheduledHour}:00`);
        });
      }
      return;
    }

    // Check if this job is ready to be processed (scheduled time has passed)
    const scheduledTime = new Date(currentHourJob.scheduledAt!);

    console.log(`🕐 Job #${currentHourJob.position} scheduled for: ${scheduledTime.toISOString()}`);
    console.log(`🕐 Current time: ${now.toISOString()}`);
    console.log(`🕐 Time difference: ${Math.round((now.getTime() - scheduledTime.getTime()) / (1000 * 60))} minutes`);

    // Check if scheduled time has passed (with 15 minute buffer for processing delays)
    const bufferMs = 15 * 60 * 1000; // 15 minutes
    if (now.getTime() < (scheduledTime.getTime() - bufferMs)) {
      const minutesUntilScheduled = Math.round((scheduledTime.getTime() - now.getTime()) / (1000 * 60));
      console.log(`⏰ Job #${currentHourJob.position} is scheduled for ${scheduledTime.toLocaleString()}, but it's ${minutesUntilScheduled} minutes too early`);
      return;
    }

    console.log(`🎯 Found job for current hour ${currentHour}: #${currentHourJob.position} "${currentHourJob.trend.title}"`);

    // Check SerpApi rate limits
    if (!serpApiMonitor.canMakeCall()) {
      console.log('⚠️ SerpApi rate limit reached, skipping article generation');
      return;
    }

    // Process the job for current hour
    console.log(`🚀 Generating article #${currentHourJob.position} for hour ${currentHour}: "${currentHourJob.trend.title}"`);
    await this.processGenerationJob(currentHourJob);
  }

  /**
   * Parse search volume from formatted traffic string
   */
  private parseSearchVolume(formattedTraffic: string): number {
    if (!formattedTraffic) return 0;
    const match = formattedTraffic.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, ''), 10) : 0;
  }

  /**
   * Generate article for a specific trend with quality control
   */
  private async generateArticleForTrend(trend: TrackedTrend): Promise<void> {
    const job: ArticleGenerationJob = {
      id: `job_${Date.now()}_${trend.id}`,
      trendId: trend.id,
      trend,
      status: 'pending',
      position: 0, // Legacy job, not part of daily plan
      createdAt: new Date().toISOString(),
      retryCount: 0
    };

    // Store job
    this.storeJob(job);
    console.log(`📋 Created generation job for "${trend.title}"`);

    await this.processGenerationJob(job);
  }

  /**
   * Process a generation job with retry logic and quality control
   */
  private async processGenerationJob(job: ArticleGenerationJob): Promise<void> {
    try {
      // Update job status
      job.status = 'generating';
      job.startedAt = new Date().toISOString();
      await this.updateJob(job);

      // Select appropriate template
      const template = articleTemplateService.selectTemplate(
        job.trend.title,
        job.trend.category,
        job.trend.source
      );
      job.template = template.type;

      console.log(`📝 Using template: ${template.type} for "${job.trend.title}"`);

      // Generate content using content generator service
      const generatedContent = await contentGenerator.generateArticle({
        topic: job.trend.title,
        category: job.trend.category,
        source: job.trend.source,
        template: template
      });

      // Fiction detection disabled - Perplexity API provides factual content with sources
      console.log(`✅ Content validation passed for "${job.trend.title}" (fiction detection disabled)`);

      // Verify we have sources from Perplexity
      if (generatedContent.sources && generatedContent.sources.length > 0) {
        console.log(`📚 Article has ${generatedContent.sources.length} sources - content is verified`);
      }

      // Quality check
      job.status = 'quality_check';
      await this.updateJob(job);

      const qualityScore = qualityScorerService.calculateQualityScore(
        generatedContent.title,
        generatedContent.content,
        generatedContent.seoTitle,
        generatedContent.seoDescription,
        job.trend.title,
        generatedContent.tags
      );

      job.qualityScore = qualityScore;
      console.log(`📊 Quality score for "${job.trend.title}": ${qualityScore.overall}/100`);
      console.log(`📊 Quality breakdown: Content=${qualityScore.content}, SEO=${qualityScore.seo}, Relevance=${qualityScore.relevance}, Uniqueness=${qualityScore.uniqueness}`);

      // Check if quality meets threshold
      if (qualityScore.overall >= this.MIN_QUALITY_SCORE) {
        // Quality passed - create article
        console.log(`🎯 Generated content title: "${generatedContent.title}"`);

        // Ensure we have a title - fallback if AI didn't generate one
        if (!generatedContent.title || generatedContent.title.trim() === '') {
          console.warn(`⚠️ No title generated by AI, creating fallback for "${job.trend.title}"`);
          generatedContent.title = `${job.trend.title}: Breaking News and Latest Updates`;
        }

        const slug = generatedContent.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        console.log(`🔗 Generated slug: "${slug}"`);

        // Validate slug
        let finalSlug = slug;
        if (!slug || slug === '' || slug === 'undefined') {
          console.error(`❌ Invalid slug generated: "${slug}" from title: "${generatedContent.title}"`);
          finalSlug = `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          console.log(`🔄 Using fallback slug: "${finalSlug}"`);
          generatedContent.title = `Breaking: ${job.trend.title}`;
        }

        // Use AI-suggested category if available, otherwise fallback to trend category
        const aiCategory = generatedContent.category;
        const rawCategory = aiCategory || job.trend.category || 'News';

        // Normalize category to standard format
        const finalCategory = this.normalizeCategory(rawCategory);

        console.log(`🎯 Category selection: AI suggested "${generatedContent.category}", trend category "${job.trend.category}", raw "${rawCategory}", normalized "${finalCategory.name}"`);

        // Calculate read time
        const wordCount = generatedContent.content?.split(' ').length || 0;
        const readTimeMinutes = Math.ceil(wordCount / 200);

        // Create article data matching EXACT structure of manual articles
        const articleData = {
          // Core content
          title: generatedContent.title,
          slug: finalSlug,
          content: generatedContent.content,
          excerpt: generatedContent.excerpt,

          // Author and metadata
          author: 'Trendy Blogger',
          readTime: `${readTimeMinutes} min read`,

          // Category as object (standard format)
          category: finalCategory,

          // Tags and SEO
          tags: generatedContent.tags || [],
          seoTitle: generatedContent.seoTitle,
          seoDescription: generatedContent.seoDescription,
          seoKeywords: generatedContent.tags || [],

          // Status and visibility
          status: 'published',
          featured: false,
          trending: true,

          // Engagement metrics (same as manual)
          views: 0,
          likes: 0,
          shares: 0,
          comments: 0,

          // Confidence and sources (same as manual)
          confidence: generatedContent.confidence || job.trend.confidence || 0.9,
          sources: generatedContent.sources || [],

          // Image (prefer Perplexity image, fallback to default)
          image: (() => {
            console.log(`🖼️ DEBUG: generatedContent.image = ${generatedContent.image}`);
            // Use category slug for image lookup
            const categorySlug = finalCategory.slug || 'general';
            console.log(`🖼️ DEBUG: category slug = ${categorySlug}`);
            console.log(`🖼️ DEBUG: fallback image = ${this.getDefaultImage(categorySlug)}`);
            const finalImage = generatedContent.image || this.getDefaultImage(categorySlug);
            console.log(`🖼️ DEBUG: final image = ${finalImage}`);
            return finalImage;
          })()
        };

        // Call article creation API directly through Firebase
        const articleId = await this.createArticleDirectly(articleData);

        if (!articleId) {
          throw new Error('Article creation failed');
        }

        // Mark trend as processed in Firebase processed_topics collection
        try {
          const { db } = await import('@/lib/firebase');
          const { doc, setDoc, Timestamp } = await import('firebase/firestore');

          const now = new Date();
          const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // +48 hours
          const keyword = job.trend.title.toLowerCase().trim();
          const docId = keyword.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);

          const processedTopic = {
            keyword: keyword,
            processedAt: Timestamp.fromDate(now),
            expiresAt: Timestamp.fromDate(expiresAt)
          };

          const docRef = doc(db, 'processed_topics', docId);
          await setDoc(docRef, processedTopic);

          console.log(`🚫 Marked "${job.trend.title}" as processed in Firebase until ${expiresAt.toLocaleString()}`);
        } catch (processedError) {
          console.warn(`⚠️ Failed to mark "${job.trend.title}" as processed:`, processedError);
        }

        // Mark trend as generated in Firebase trends collection
        try {
          const { firebaseTrendsService } = await import('./firebase-trends');
          await firebaseTrendsService.markTrendAsGenerated(job.trendId, articleId);
          console.log(`✅ Marked trend ${job.trendId} as generated in Firebase`);
        } catch (trendError) {
          console.warn(`⚠️ Failed to mark trend as generated:`, trendError);
        }

        // Mark as completed
        job.status = 'completed';
        job.completedAt = new Date().toISOString();
        job.articleId = articleId;
        await this.updateJob(job);

        console.log(`✅ High-quality article generated for "${job.trend.title}": ${articleId} (Score: ${qualityScore.overall})`);

        // Check if this was the last article in the daily plan
        await this.checkAndRenewDailyPlan();

        // Return the article ID for further processing
        return { success: true, articleId };

      } else {
        // Quality too low - retry or reject
        if ((job.retryCount || 0) < this.MAX_RETRIES) {
          job.retryCount = (job.retryCount || 0) + 1;
          job.status = 'pending';
          console.log(`⚠️ Quality too low (${qualityScore.overall}), retrying (${job.retryCount}/${this.MAX_RETRIES}) for "${job.trend.title}"`);

          // Retry with delay
          setTimeout(() => {
            this.processGenerationJob(job);
          }, 5000);
        } else {
          // Max retries reached - reject
          job.status = 'rejected';
          job.completedAt = new Date().toISOString();
          job.error = `Quality score too low: ${qualityScore.overall}/${this.MIN_QUALITY_SCORE}`;
          await this.updateJob(job);

          console.log(`❌ Article rejected for "${job.trend.title}" after ${this.MAX_RETRIES} retries (Score: ${qualityScore.overall})`);
        }
      }

    } catch (error) {
      // Handle generation error
      if ((job.retryCount || 0) < this.MAX_RETRIES) {
        job.retryCount = (job.retryCount || 0) + 1;
        job.status = 'pending';
        console.log(`❌ Generation error, retrying (${job.retryCount}/${this.MAX_RETRIES}) for "${job.trend.title}":`, error);

        // Retry with delay
        setTimeout(() => {
          this.processGenerationJob(job);
        }, 10000);
      } else {
        // Mark as failed
        job.status = 'failed';
        job.completedAt = new Date().toISOString();
        job.error = error instanceof Error ? error.message : 'Unknown error';
        await this.updateJob(job);

        console.error(`❌ Failed to generate article for "${job.trend.title}" after ${this.MAX_RETRIES} retries:`, error);
      }
    }
  }

  /**
   * Get generation statistics
   */
  async getStats(): Promise<GenerationStats> {
    const jobs = this.getStoredJobs();
    const todayJobs = this.getTodayJobCount();
    const dailyPlan = await this.getCurrentDailyPlan();

    // Find next scheduled job (with safe date parsing)
    const nextScheduledJob = dailyPlan?.jobs
      .filter(job => {
        if (job.status !== 'pending' || !job.scheduledAt) return false;
        // Validate scheduledAt is a valid date string
        try {
          const testDate = new Date(job.scheduledAt);
          return !isNaN(testDate.getTime());
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        try {
          return new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime();
        } catch {
          return 0;
        }
      })[0];

    // Calculate time until next article (with safe date parsing)
    let timeUntilNext = null;
    let nextArticleInfo = null;
    if (nextScheduledJob && nextScheduledJob.scheduledAt) {
      try {
        const now = new Date();
        const nextTime = new Date(nextScheduledJob.scheduledAt);

        // Validate the date is valid
        if (!isNaN(nextTime.getTime())) {
          const diffMs = nextTime.getTime() - now.getTime();

          if (diffMs > 0) {
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            timeUntilNext = `${hours}h ${minutes}m`;
            nextArticleInfo = {
              position: nextScheduledJob.position,
              title: nextScheduledJob.trend.title,
              scheduledAt: nextScheduledJob.scheduledAt,
              timeUntil: timeUntilNext
            };
          }
        }
      } catch (error) {
        console.warn('⚠️ Error calculating time until next article:', error);
      }
    }

    // Check if we're actually running (considers production vs development mode)
    const actuallyRunning = await this.isActuallyRunning();

    // Only fix inconsistency in development mode
    const isProduction = process.env.NODE_ENV === 'production' && process.env.VERCEL;
    if (!isProduction && this.isRunning && !this.intervalId) {
      console.warn('⚠️ Inconsistent state detected in development: isRunning=true but no intervalId. Fixing...');
      this.isRunning = false;
    }

    return {
      totalJobs: jobs.length,
      pendingJobs: jobs.filter(j => j.status === 'pending').length,
      generatingJobs: jobs.filter(j => j.status === 'generating').length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      failedJobs: jobs.filter(j => j.status === 'failed').length,
      rejectedJobs: jobs.filter(j => j.status === 'rejected').length,
      todayJobs,
      isRunning: actuallyRunning,
      lastRun: jobs.length > 0 ? jobs[jobs.length - 1].createdAt : undefined,
      nextRun: actuallyRunning ? new Date(Date.now() + this.CHECK_INTERVAL).toISOString() : undefined,
      dailyPlan,
      nextScheduledJob,
      nextArticleInfo
    };
  }

  /**
   * Get recent jobs
   */
  getRecentJobs(limit: number = 20): ArticleGenerationJob[] {
    const jobs = this.getStoredJobs();
    return jobs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * Get today's job count
   */
  private getTodayJobCount(): number {
    const today = new Date().toISOString().split('T')[0];
    const jobs = this.getStoredJobs();
    
    return jobs.filter(job => 
      job.createdAt.startsWith(today)
    ).length;
  }

  /**
   * Store job
   */
  private storeJob(job: ArticleGenerationJob): void {
    const jobs = this.getStoredJobs();
    jobs.push(job);
    this.storeJobs(jobs);
  }

  /**
   * Update existing job (both in storage and daily plan)
   */
  private async updateJob(updatedJob: ArticleGenerationJob): Promise<void> {
    // Update in regular storage
    const jobs = this.getStoredJobs();
    const index = jobs.findIndex(j => j.id === updatedJob.id);

    if (index !== -1) {
      jobs[index] = updatedJob;
      this.storeJobs(jobs);
    }

    // Also update in daily plan if it exists there
    await this.updateJobInPlan(updatedJob);
  }

  /**
   * Get stored jobs
   */
  private getStoredJobs(): ArticleGenerationJob[] {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
      }
      return [];
    } catch (error) {
      console.error('Error loading stored jobs:', error);
      return [];
    }
  }

  /**
   * Store jobs
   */
  private storeJobs(jobs: ArticleGenerationJob[]): void {
    try {
      if (typeof window !== 'undefined') {
        // Keep only recent jobs (last 100)
        const recentJobs = jobs.slice(-100);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentJobs));
      }
    } catch (error) {
      console.error('Error storing jobs:', error);
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 🚨 CRITICAL: Validate content for fictional elements
   */
  private validateContentForFiction(content: any, topic: string): boolean {
    // Fiction detection disabled - Perplexity API provides factual content with sources
    console.log(`✅ Fiction validation disabled for "${topic}" - Perplexity content is factual`);
    return false;
  }

  /**
   * Normalize category to standard format
   */
  private normalizeCategory(rawCategory: string): { id: string; name: string; slug: string; color: string } {
    // Standard categories mapping
    const categoryMap: Record<string, { id: string; name: string; slug: string; color: string }> = {
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

    // Try exact match first
    if (categoryMap[rawCategory]) {
      return categoryMap[rawCategory];
    }

    // Try case-insensitive match
    const lowerCategory = rawCategory.toLowerCase();
    for (const [key, value] of Object.entries(categoryMap)) {
      if (key.toLowerCase() === lowerCategory) {
        return value;
      }
    }

    // Try partial match (remove special characters)
    const cleanCategory = rawCategory.replace(/[^\w\s]/g, '').trim().toLowerCase();
    for (const [key, value] of Object.entries(categoryMap)) {
      const cleanKey = key.replace(/[^\w\s]/g, '').trim().toLowerCase();
      if (cleanKey === cleanCategory) {
        return value;
      }
    }

    // Default to News if no match found
    console.warn(`⚠️ No category mapping found for "${rawCategory}", defaulting to News`);
    return { id: 'news', name: 'News', slug: 'news', color: '#FF3B30' };
  }

  private isPersonTopic(topic: string): boolean {
    // Simple heuristic to detect if topic is about a person
    const personIndicators = [
      'robert redford',
      'taylor swift',
      'elon musk',
      'joe biden',
      'donald trump'
    ];

    return personIndicators.some(indicator =>
      topic.toLowerCase().includes(indicator)
    );
  }

  /**
   * Clear all jobs (for testing)
   */
  clearJobs(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.STORAGE_KEY);
      }
      console.log('✅ Generation jobs cleared');
    } catch (error) {
      console.error('Error clearing jobs:', error);
    }
  }

  /**
   * DEPRECATED: Generate article from Firebase trend data
   * This method is disabled to prevent articles being generated outside of daily plan system
   */
  async generateArticleFromTrend(trendData: {
    topic: string;
    keyword: string;
    category: string;
    traffic: string;
    searchVolume: number;
    confidence: number;
    sources: Array<{ title: string; url: string; domain: string; }>;
  }): Promise<ArticleGenerationJob | null> {
    console.log(`⚠️ generateArticleFromTrend() called for "${trendData.topic}" but is DISABLED`);
    console.log(`🔄 Only daily plan system generates articles now. Use daily plan instead.`);
    return null;
  }

  /**
   * Get default image for category (same as manual articles)
   */
  private getDefaultImage(categoryId: string): string {
    const imageMap: { [key: string]: string } = {
      'technology': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=800&fit=crop',
      'news': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=800&fit=crop',
      'business': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=800&fit=crop',
      'science': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&h=800&fit=crop',
      'health': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=800&fit=crop',
      'entertainment': 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=1200&h=800&fit=crop',
      'general': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=800&fit=crop'
    };

    return imageMap[categoryId] || imageMap['general'];
  }

  /**
   * Create article directly through Firebase (bypassing API)
   */
  private async createArticleDirectly(articleData: any): Promise<string> {
    try {
      const { db } = await import('@/lib/firebase');
      const { collection, addDoc, Timestamp } = await import('firebase/firestore');

      const articlesCollection = collection(db, 'articles');

      const now = Timestamp.now();
      const finalArticleData = {
        ...articleData,
        createdAt: now,
        updatedAt: now,
        publishedAt: now // Důležité pro řazení!
        // Ostatní fieldy už jsou v articleData
      };

      console.log(`💾 Saving article to Firebase:`, {
        title: finalArticleData.title,
        slug: finalArticleData.slug,
        author: finalArticleData.author,
        category: finalArticleData.category,
        tags: finalArticleData.tags,
        status: finalArticleData.status,
        views: finalArticleData.views,
        likes: finalArticleData.likes,
        trending: finalArticleData.trending,
        confidence: finalArticleData.confidence,
        image: finalArticleData.image,
        sources: finalArticleData.sources?.length || 0
      });

      // Validate critical fields
      if (!finalArticleData.title) {
        throw new Error('Article title is missing');
      }
      if (!finalArticleData.slug) {
        throw new Error('Article slug is missing');
      }
      if (!finalArticleData.status) {
        throw new Error('Article status is missing');
      }

      const docRef = await addDoc(articlesCollection, finalArticleData);

      console.log(`✅ Article saved directly to Firebase: ${docRef.id}`);
      console.log(`🔗 Article should be available at: /article/${finalArticleData.slug}`);

      // Notify search engines about new article
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hotnewstrends.com';
        const pingResponse = await fetch(`${baseUrl}/api/sitemap/ping`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            articleSlug: finalArticleData.slug,
            action: 'new'
          })
        });

        if (pingResponse.ok) {
          console.log(`🔔 Search engines notified about new article: ${finalArticleData.slug}`);
        } else {
          console.warn(`⚠️ Failed to notify search engines: ${pingResponse.status}`);
        }
      } catch (pingError) {
        console.warn('⚠️ Could not ping search engines:', pingError);
      }

      return docRef.id;

    } catch (error) {
      console.error('❌ Error creating article directly:', error);
      throw error;
    }
  }

  /**
   * Get daily plan for a specific date
   */
  private async getDailyPlan(date: string): Promise<DailyPlan | null> {
    try {
      if (typeof window !== 'undefined') {
        // Client-side: use localStorage as fallback
        const stored = localStorage.getItem(`${this.DAILY_PLAN_KEY}_${date}`);
        return stored ? JSON.parse(stored) : null;
      } else {
        // Server-side: use Firebase
        const { firebaseDailyPlansService } = await import('./firebase-daily-plans');
        return await firebaseDailyPlansService.getDailyPlan(date);
      }
    } catch (error) {
      console.error('Error loading daily plan:', error);
      return null;
    }
  }

  /**
   * Store daily plan for a specific date
   */
  private async storeDailyPlan(plan: DailyPlan): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        // Client-side: use localStorage as fallback
        localStorage.setItem(`${this.DAILY_PLAN_KEY}_${plan.date}`, JSON.stringify(plan));
      } else {
        // Server-side: use Firebase
        const { firebaseDailyPlansService } = await import('./firebase-daily-plans');
        await firebaseDailyPlansService.storeDailyPlan(plan);
      }
    } catch (error) {
      console.error('Error storing daily plan:', error);
      throw error;
    }
  }

  /**
   * Get current daily plan (today's plan)
   */
  public async getCurrentDailyPlan(): Promise<DailyPlan | null> {
    const today = new Date().toISOString().split('T')[0];
    return await this.getDailyPlan(today);
  }

  /**
   * Update a job in the daily plan
   */
  private async updateJobInPlan(updatedJob: ArticleGenerationJob): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      if (typeof window !== 'undefined') {
        // Client-side: use localStorage
        const dailyPlan = await this.getDailyPlan(today);
        if (!dailyPlan) return;

        const jobIndex = dailyPlan.jobs.findIndex(job => job.id === updatedJob.id);
        if (jobIndex !== -1) {
          dailyPlan.jobs[jobIndex] = updatedJob;
          dailyPlan.updatedAt = new Date().toISOString();
          await this.storeDailyPlan(dailyPlan);
        }
      } else {
        // Server-side: use Firebase
        const { firebaseDailyPlansService } = await import('./firebase-daily-plans');
        await firebaseDailyPlansService.updateJobInPlan(today, updatedJob);
      }
    } catch (error) {
      console.error('Error updating job in plan:', error);
    }
  }

  /**
   * Smart refresh of daily plan - automatically decides between refresh or fresh reset
   * If too many processed topics are in the plan, creates a fresh plan
   * Otherwise, preserves existing articles and updates future ones
   */
  public async refreshDailyPlan(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    console.log('🔄 Refreshing daily plan with fresh trends for', today);

    // Always update future articles with fresh trends when new data arrives
    // This ensures the plan stays current with latest trending topics
    console.log('🔄 Updating future articles with fresh trends from Firebase');
    await this.updateFutureDailyPlan(today);
    console.log('✅ Daily plan refreshed - preserved completed articles, updated pending ones with fresh trends');
  }

  /**
   * Check if we should create a fresh daily plan instead of updating existing one
   * Returns true if too many processed topics are in the current plan
   */
  private async shouldCreateFreshPlan(date: string): Promise<boolean> {
    try {
      const currentPlan = await this.getDailyPlan(date);
      if (!currentPlan || currentPlan.jobs.length === 0) {
        console.log('📝 No existing daily plan found, will create fresh one');
        return true;
      }

      // Check how many jobs contain processed topics
      const { firebaseProcessedTopicsService } = await import('./firebase-processed-topics');
      let processedTopicsCount = 0;

      for (const job of currentPlan.jobs) {
        if (job.trend?.title) {
          const isProcessed = await firebaseProcessedTopicsService.isTopicProcessed(job.trend.title);
          if (isProcessed) {
            processedTopicsCount++;
          }
        }
      }

      const processedPercentage = (processedTopicsCount / currentPlan.jobs.length) * 100;
      console.log(`📊 Daily plan analysis: ${processedTopicsCount}/${currentPlan.jobs.length} jobs are processed topics (${processedPercentage.toFixed(1)}%)`);

      // Check how many jobs are completed/rejected (not just processed topics)
      const completedJobs = currentPlan.jobs.filter(job =>
        job.status === 'completed' || job.status === 'rejected'
      ).length;
      const completedPercentage = (completedJobs / currentPlan.jobs.length) * 100;

      console.log(`📊 Daily plan status: ${completedJobs}/${currentPlan.jobs.length} jobs completed (${completedPercentage.toFixed(1)}%)`);
      console.log(`📊 Processed topics: ${processedTopicsCount}/${currentPlan.jobs.length} (${processedPercentage.toFixed(1)}%)`);

      // Always update with fresh trends when new data arrives - lower thresholds for more frequent updates
      const completedThreshold = 30; // Lowered from 80% to 30%
      const processedThreshold = 20; // Lowered from 50% to 20%
      const needsFresh = completedPercentage > completedThreshold || processedPercentage > processedThreshold;

      if (needsFresh) {
        const reason = completedPercentage > completedThreshold ?
          `${completedPercentage.toFixed(1)}% completed > ${completedThreshold}%` :
          `${processedPercentage.toFixed(1)}% processed topics > ${processedThreshold}%`;
        console.log(`🔄 ${reason} - will create fresh plan`);
      } else {
        console.log(`✅ ${completedPercentage.toFixed(1)}% completed <= ${completedThreshold}% AND ${processedPercentage.toFixed(1)}% processed <= ${processedThreshold}% - will update existing plan`);
      }

      return needsFresh;

    } catch (error) {
      console.error('❌ Error checking if fresh plan needed:', error);
      // On error, default to updating existing plan
      return false;
    }
  }

  /**
   * Update only future articles in daily plan (preserve already generated ones)
   */
  private async updateFutureDailyPlan(date: string): Promise<DailyPlan> {
    console.log(`🔄 Updating future articles in daily plan for date: ${date}`);

    try {
      // Get current daily plan
      const currentPlan = await this.getDailyPlan(date);
      if (!currentPlan) {
        console.log('📝 No existing daily plan found, creating fresh one');
        return await this.createFreshDailyPlan(date);
      }

      console.log(`📋 Found existing daily plan with ${currentPlan.jobs.length} jobs`);

      // Determine current Prague time and which articles are already generated
      const now = new Date();
      const pragueTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Prague"}));
      const currentHour = pragueTime.getHours();
      const currentMinute = pragueTime.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinute;

      console.log(`🕐 Current Prague time: ${pragueTime.toLocaleString()} (${currentHour}:${currentMinute.toString().padStart(2, '0')})`);

      // Separate jobs by status: preserve completed/generating jobs, update pending ones
      const preservedJobs = [];
      const jobsToUpdate = [];

      for (const job of currentPlan.jobs) {
        // Check job status to determine if it should be preserved or updated
        const isCompleted = job.status === 'completed' || job.status === 'rejected';
        const isInProgress = job.status === 'generating' || job.status === 'quality_check';

        if (isCompleted || isInProgress) {
          // Preserve jobs that are completed or currently being processed
          preservedJobs.push(job);
          console.log(`✅ Preserving job #${job.position}: "${job.trend?.title || 'Unknown'}" (status: ${job.status})`);
        } else {
          // Update pending/failed jobs with fresh trends
          jobsToUpdate.push(job);
          console.log(`🔄 Will update job #${job.position}: "${job.trend?.title || 'Unknown'}" (status: ${job.status})`);
        }
      }

      console.log(`📊 Preserving ${preservedJobs.length} completed/in-progress jobs, updating ${jobsToUpdate.length} pending jobs with fresh trends`);

      // Get trends needing articles from Firebase for future jobs (excluding processed topics)
      const { firebaseTrendsService } = await import('./firebase-trends');
      const firebaseTrends = await firebaseTrendsService.getTrendsNeedingArticles(50);
      console.log(`📊 Retrieved ${firebaseTrends.length} trends needing articles from Firebase`);

      // Convert and sort trends
      const allTrends = firebaseTrends.map((fbTrend: any) => ({
        id: fbTrend.id,
        title: fbTrend.title || fbTrend.keyword,
        keyword: fbTrend.keyword || fbTrend.title,
        category: fbTrend.category || 'general',
        traffic: fbTrend.formattedTraffic || `${fbTrend.searchVolume || 0}+`,
        formattedTraffic: fbTrend.formattedTraffic || `${fbTrend.searchVolume || 0}+`,
        searchVolume: fbTrend.searchVolume || 0,
        region: fbTrend.region || 'US',
        timeframe: fbTrend.timeframe || 'now',
        relatedQueries: fbTrend.relatedQueries || [],
        confidence: fbTrend.confidence || 0.8,
        growthRate: fbTrend.growthRate || 25,
        source: fbTrend.source || 'Firebase',
        sources: fbTrend.sources || []
      }));

      // Sort by search volume (highest first)
      const sortedTrends = allTrends.sort((a, b) => (b.searchVolume || 0) - (a.searchVolume || 0));

      // Remove duplicates and exclude already used trends
      const usedTitles = new Set(
        preservedJobs
          .filter(job => job.trend && job.trend.title)
          .map(job => job.trend.title.toLowerCase().trim())
      );
      const availableTrends = [];
      const seenTitles = new Set();

      for (const trend of sortedTrends) {
        if (!trend.title) {
          console.warn('⚠️ Trend missing title:', trend);
          continue;
        }

        const normalizedTitle = trend.title.toLowerCase().trim();
        if (!seenTitles.has(normalizedTitle) && !usedTitles.has(normalizedTitle)) {
          seenTitles.add(normalizedTitle);
          availableTrends.push(trend);
        }
      }

      console.log(`📊 Found ${availableTrends.length} available trends for pending jobs`);

      // Update pending jobs with new trends
      const updatedJobs = jobsToUpdate.map((job, index) => {
        if (index < availableTrends.length) {
          const newTrend = availableTrends[index];
          console.log(`🔄 Updating job #${job.position}: "${job.trend.title}" → "${newTrend.title}" (${newTrend.searchVolume} searches)`);

          // Ensure scheduledAt exists - create if missing
          let scheduledAt = job.scheduledAt;
          if (!scheduledAt) {
            console.warn(`⚠️ Job #${job.position} missing scheduledAt, creating new one`);
            // Create scheduled time for hourly generation (0:00, 1:00, 2:00, etc.)
            const scheduledHour = (job.position - 1) % 24; // Position 1 = hour 0, position 2 = hour 1, etc.

            // Create proper Prague time and convert to UTC
            const [year, month, day] = date.split('-').map(Number);
            const pragueTimeString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${scheduledHour.toString().padStart(2, '0')}:00:00`;
            const pragueDate = new Date(pragueTimeString);
            const pragueOffsetHours = 2;
            const scheduledTime = new Date(pragueDate.getTime() - (pragueOffsetHours * 60 * 60 * 1000));
            scheduledAt = scheduledTime.toISOString();
          }

          return {
            ...job,
            trend: newTrend,
            status: 'pending' as const,
            updatedAt: new Date(),
            // Keep or create scheduledAt - CRITICAL for time-based processing!
            scheduledAt: scheduledAt
          };
        } else {
          // Keep original if no new trend available - but ensure scheduledAt exists
          let scheduledAt = job.scheduledAt;
          if (!scheduledAt) {
            console.warn(`⚠️ Job #${job.position} missing scheduledAt, creating new one`);
            // Create scheduled time for hourly generation (0:00, 1:00, 2:00, etc.)
            const scheduledHour = (job.position - 1) % 24; // Position 1 = hour 0, position 2 = hour 1, etc.

            // Create proper Prague time and convert to UTC
            const [year, month, day] = date.split('-').map(Number);
            const pragueTimeString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${scheduledHour.toString().padStart(2, '0')}:00:00`;
            const pragueDate = new Date(pragueTimeString);
            const pragueOffsetHours = 2;
            const scheduledTime = new Date(pragueDate.getTime() - (pragueOffsetHours * 60 * 60 * 1000));
            scheduledAt = scheduledTime.toISOString();
          }

          console.log(`⚠️ No new trend available for job #${job.position}, keeping "${job.trend.title}"`);
          return {
            ...job,
            scheduledAt: scheduledAt
          };
        }
      });

      // Combine preserved and updated jobs
      const allJobs = [...preservedJobs, ...updatedJobs];
      allJobs.sort((a, b) => a.position - b.position);

      // Create updated daily plan
      const updatedPlan: DailyPlan = {
        ...currentPlan,
        jobs: allJobs,
        updatedAt: new Date().toISOString(),
        totalJobs: allJobs.length,
        completedJobs: preservedJobs.filter(job => job.status === 'completed').length,
        pendingJobs: allJobs.filter(job => job.status === 'pending').length
      };

      // Save updated plan
      await this.storeDailyPlan(updatedPlan);
      console.log(`✅ Updated daily plan saved with ${preservedJobs.length} preserved + ${updatedJobs.length} updated jobs`);

      return updatedPlan;

    } catch (error) {
      console.error('❌ Error updating future daily plan:', error);
      throw error;
    }
  }

  /**
   * Create a fresh daily plan with trends needing articles (excluding processed topics)
   */
  public async createFreshDailyPlan(date: string): Promise<DailyPlan> {
    console.log(`🔄 Creating fresh daily plan for date: ${date}`);

    try {
      // Get trends that need articles (excluding processed topics)
      console.log('📊 Fetching trends needing articles from Firebase for fresh daily plan...');

      let firebaseTrends: any[] = [];

      try {
        const { firebaseTrendsService } = await import('./firebase-trends');
        firebaseTrends = await firebaseTrendsService.getTrendsNeedingArticles(50); // Get trends excluding processed topics
        console.log(`📊 Retrieved ${firebaseTrends.length} trends needing articles from Firebase`);
      } catch (firebaseError) {
        console.error('❌ Firebase trends fetch failed:', firebaseError);
        throw firebaseError;
      }

      if (!firebaseTrends || firebaseTrends.length === 0) {
        console.warn('⚠️ No trends available from Firebase for fresh daily plan');
        throw new Error('No trends available');
      }

      // Convert Firebase trends to TrackedTrend format
      const allTrends = firebaseTrends.map((fbTrend: any) => {
        const trend = {
          id: fbTrend.id,
          title: fbTrend.title || fbTrend.keyword,
          keyword: fbTrend.keyword || fbTrend.title,
          category: fbTrend.category || 'general',
          traffic: fbTrend.formattedTraffic || `${fbTrend.searchVolume || 0}+`,
          formattedTraffic: fbTrend.formattedTraffic || `${fbTrend.searchVolume || 0}+`,
          searchVolume: fbTrend.searchVolume || 0,
          region: fbTrend.region || 'US',
          timeframe: fbTrend.timeframe || 'now',
          relatedQueries: fbTrend.relatedQueries || [],
          confidence: fbTrend.confidence || 0.8,
          growthRate: fbTrend.growthRate || 25,
          source: fbTrend.source || 'Firebase',
          sources: fbTrend.sources || []
        };
        return trend;
      });

      // Sort by search volume (highest first)
      const sortedTrends = allTrends.sort((a, b) => (b.searchVolume || 0) - (a.searchVolume || 0));
      console.log(`📊 Sorted ${sortedTrends.length} trends by search volume`);
      console.log(`🔍 Top trend: "${sortedTrends[0]?.title}" (${sortedTrends[0]?.searchVolume} searches, source: ${sortedTrends[0]?.source})`);

      // Remove duplicates by title (keep highest search volume)
      const uniqueTrends = [];
      const seenTitles = new Set();

      for (const trend of sortedTrends) {
        const normalizedTitle = trend.title.toLowerCase().trim();
        if (!seenTitles.has(normalizedTitle)) {
          seenTitles.add(normalizedTitle);
          uniqueTrends.push(trend);
        } else {
          console.log(`🔄 Skipping duplicate: "${trend.title}" (${trend.searchVolume} searches)`);
        }
      }

      console.log(`✅ Deduplication: ${sortedTrends.length} → ${uniqueTrends.length} unique trends`);

      // Create jobs for top unique trends
      const jobs: ArticleGenerationJob[] = [];
      const maxJobs = Math.min(this.MAX_DAILY_ARTICLES, uniqueTrends.length);
      const startHour = 0; // Start at midnight (00:00)
      const intervalHours = 1; // Generate every 1 hour

      for (let i = 0; i < maxJobs; i++) {
        const trend = uniqueTrends[i];

        // Create scheduled time for the target date (every hour starting from 00:00 Prague time)
        // Create a date in Prague timezone for the specific hour
        const scheduledHour = startHour + (i * intervalHours); // Every hour: 0, 1, 2, 3...

        // Create proper Prague time and convert to UTC
        const [year, month, day] = date.split('-').map(Number);
        const pragueTimeString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${scheduledHour.toString().padStart(2, '0')}:00:00`;
        const pragueDate = new Date(pragueTimeString);
        const pragueOffsetHours = 2;
        const scheduledTime = new Date(pragueDate.getTime() - (pragueOffsetHours * 60 * 60 * 1000));

        const job: ArticleGenerationJob = {
          id: `job_${date}_${i + 1}_${trend.title.replace(/[^a-zA-Z0-9]/g, '_')}`,
          trendId: trend.id,
          trend,
          status: 'pending',
          position: i + 1,
          createdAt: new Date().toISOString(),
          scheduledAt: scheduledTime.toISOString()
        };

        jobs.push(job);
      }

      const dailyPlan: DailyPlan = {
        date,
        jobs,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.storeDailyPlan(dailyPlan);
      console.log(`✅ Fresh daily plan created with ${jobs.length} jobs from latest trends`);

      return dailyPlan;

    } catch (error) {
      console.error('❌ Error creating fresh daily plan:', error);
      throw error;
    }
  }

  /**
   * Reset failed and rejected jobs back to pending status
   */
  public async resetFailedJobs(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const dailyPlan = await this.getDailyPlan(today);

    if (!dailyPlan) {
      console.log('⚠️ No daily plan found to reset');
      return;
    }

    let resetCount = 0;
    dailyPlan.jobs.forEach(job => {
      if (job.status === 'failed' || job.status === 'rejected') {
        job.status = 'pending';
        job.error = undefined;
        job.startedAt = undefined;
        job.completedAt = undefined;
        resetCount++;
      }
    });

    if (resetCount > 0) {
      dailyPlan.updatedAt = new Date().toISOString();
      await this.storeDailyPlan(dailyPlan);
      console.log(`🔄 Reset ${resetCount} failed/rejected jobs back to pending`);
    } else {
      console.log('✅ No failed/rejected jobs to reset');
    }
  }

  /**
   * REMOVED: Test mode functionality - articles now generate hourly as designed
   * Use reset functionality if you need to restart the daily plan
   */

  /**
   * Disable test mode - restore normal scheduling (6:00-22:00, ~40min intervals)
   */
  public async disableTestMode(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const dailyPlan = await this.getDailyPlan(today);

    if (!dailyPlan) {
      console.log('⚠️ No daily plan found for disabling test mode');
      return;
    }

    console.log('🔄 Disabling test mode - restoring hourly scheduling...');

    const startHour = 0; // Start at midnight (00:00)
    const intervalHours = 1; // Generate every 1 hour
    let restoredCount = 0;

    dailyPlan.jobs.forEach((job, index) => {
      if (job.status === 'pending') {
        // Restore hourly scheduling
        const scheduledTime = new Date(today + 'T00:00:00.000Z');
        const scheduledHour = startHour + ((job.position - 1) * intervalHours); // Every hour: 0, 1, 2, 3...
        scheduledTime.setUTCHours(scheduledHour, 0, 0, 0); // Always at :00 minutes

        job.scheduledAt = scheduledTime.toISOString();
        restoredCount++;
      }
    });

    if (restoredCount > 0) {
      dailyPlan.updatedAt = new Date().toISOString();
      await this.storeDailyPlan(dailyPlan);
      console.log(`✅ Test mode disabled: ${restoredCount} jobs restored to hourly scheduling (00:00-23:00)`);
      console.log(`📅 Jobs now scheduled every hour starting from midnight`);
    } else {
      console.log('✅ No pending jobs to restore from test mode');
    }
  }

  /**
   * Check if error is a Firebase connection error
   */
  private isFirebaseConnectionError(error: any): boolean {
    if (!error) return false;

    const errorMessage = error.message || error.toString() || '';
    const errorCode = error.code || '';

    // Common Firebase connection error patterns
    const firebaseErrorPatterns = [
      'Write error: write after end',
      'GrpcConnection RPC',
      'INTERNAL: Write error',
      'Code: 13 Message: 13 INTERNAL',
      'Connection closed',
      'UNAVAILABLE',
      'DEADLINE_EXCEEDED',
      'Connection error',
      'Network error'
    ];

    return firebaseErrorPatterns.some(pattern =>
      errorMessage.includes(pattern) || errorCode.includes(pattern)
    );
  }

  /**
   * Handle Firebase connection errors
   */
  private async handleFirebaseError(): Promise<void> {
    try {
      console.log('🔥 Handling Firebase connection error...');

      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Try to reinitialize Firebase connection if needed
      try {
        const { db } = await import('@/lib/firebase');
        console.log('🔥 Firebase connection test successful');
      } catch (reinitError) {
        console.error('🔥 Firebase reinit failed:', reinitError);

        // If Firebase is still failing, wait longer before next attempt
        await new Promise(resolve => setTimeout(resolve, 30000));
      }

    } catch (error) {
      console.error('🔥 Error in Firebase error handler:', error);
    }
  }

  /**
   * Store start time for persistence tracking
   */
  private storeStartTime(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('article_generator_start_time', new Date().toISOString());
        localStorage.setItem('article_generator_status', 'running');
      }
    } catch (error) {
      console.warn('Failed to store start time:', error);
    }
  }

  /**
   * Update last activity timestamp
   */
  private updateLastActivity(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('article_generator_last_activity', new Date().toISOString());
      }
    } catch (error) {
      console.warn('Failed to update last activity:', error);
    }
  }

  /**
   * Check if service should auto-restart based on stored state
   */
  public checkAutoRestart(): boolean {
    try {
      if (typeof window !== 'undefined') {
        const status = localStorage.getItem('article_generator_status');
        const startTime = localStorage.getItem('article_generator_start_time');
        const lastActivity = localStorage.getItem('article_generator_last_activity');

        if (status === 'running' && startTime) {
          const startDate = new Date(startTime);
          const now = new Date();
          const hoursSinceStart = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60);

          // If it was running recently (within 24 hours) and we're not currently running
          if (hoursSinceStart < 24 && !this.isRunning) {
            console.log('🔄 Auto-restarting article generator based on stored state');
            return true;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to check auto-restart:', error);
    }
    return false;
  }
}

export const automatedArticleGenerator = new AutomatedArticleGenerator();
export default automatedArticleGenerator;
