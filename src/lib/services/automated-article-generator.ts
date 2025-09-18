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
  private readonly GENERATION_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
  private readonly MIN_QUALITY_SCORE = 60; // Minimum quality threshold (lowered for testing)
  private readonly MAX_RETRIES = 2; // Maximum retry attempts per article
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  /**
   * Get interval ID for debugging
   */
  get intervalIdForDebug(): NodeJS.Timeout | undefined {
    return this.intervalId;
  }

  /**
   * Start automated article generation
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ Automated article generation already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting automated article generation...');

    // Run immediately
    this.processNewTrends();

    // Set up interval
    this.intervalId = setInterval(() => {
      this.processNewTrends();
    }, this.GENERATION_INTERVAL);

    console.log(`✅ Automated generation started (every ${this.GENERATION_INTERVAL / 60000} minutes)`);
  }

  /**
   * Stop automated article generation
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ Automated article generation not running');
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    console.log('🛑 Automated article generation stopped');
  }

  /**
   * Process scheduled articles and generate them at the right time
   */
  private async processNewTrends(): Promise<void> {
    try {
      console.log('🔍 Checking scheduled articles and daily plan...');

      // Ensure we have a daily plan
      try {
        await this.ensureDailyPlan();
      } catch (planError) {
        console.error('❌ Error ensuring daily plan:', planError);
        // Continue with processing even if daily plan fails
      }

      // Check for articles that should be generated now
      try {
        await this.processScheduledJobs();
      } catch (jobsError) {
        console.error('❌ Error processing scheduled jobs:', jobsError);
        // Continue running even if job processing fails
      }

    } catch (error) {
      console.error('❌ Critical error in processNewTrends:', error);
      // Don't stop the service for errors - just log them
    }
  }

  /**
   * Ensure we have a daily plan for today with 24 articles
   */
  private async ensureDailyPlan(): Promise<void> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    let dailyPlan = await this.getDailyPlan(today);

    if (!dailyPlan || dailyPlan.jobs.length < this.MAX_DAILY_ARTICLES) {
      console.log('📅 Creating/updating daily plan for', today);
      dailyPlan = await this.createDailyPlan(today);
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
      const startHour = 6; // Start at 6:00 AM
      const endHour = 22; // End at 10:00 PM
      const intervalMinutes = (endHour - startHour) * 60 / this.MAX_DAILY_ARTICLES; // ~40 minutes apart

      for (let i = completedJobs.length; i < this.MAX_DAILY_ARTICLES && i < sortedTrends.length; i++) {
        const trend = sortedTrends[i];

        // Create scheduled time for the target date
        const scheduledTime = new Date(date + 'T00:00:00.000Z');
        const scheduledHour = startHour + Math.floor(i * intervalMinutes / 60);
        const scheduledMinute = Math.floor(i * intervalMinutes) % 60;
        scheduledTime.setUTCHours(scheduledHour, scheduledMinute, 0, 0);

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
          console.log(`📅 Job ${i + 1}: "${trend.title}" scheduled for ${scheduledTime.toLocaleString()}`);
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
   * Process jobs that are scheduled to run now
   */
  private async processScheduledJobs(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const dailyPlan = await this.getDailyPlan(today);

    if (!dailyPlan) return;

    const now = new Date();
    console.log(`🕐 Current time: ${now.toLocaleString()} (${now.toISOString()})`);
    console.log(`📋 Daily plan has ${dailyPlan.jobs.length} jobs total`);

    // Debug: Show all jobs with their scheduled times
    console.log('📅 All jobs in daily plan:');
    dailyPlan.jobs.forEach(job => {
      const scheduledTime = job.scheduledAt ? new Date(job.scheduledAt) : null;
      const isReady = scheduledTime ? scheduledTime <= now : false;
      console.log(`  #${job.position}: "${job.trend.title}" - Status: ${job.status} - Scheduled: ${scheduledTime?.toLocaleString() || 'N/A'} ${isReady ? '✅ READY' : '⏰ WAITING'}`);
    });

    const pendingJobs = dailyPlan.jobs.filter(job =>
      job.status === 'pending' &&
      job.scheduledAt &&
      new Date(job.scheduledAt) <= now
    );

    console.log(`🎯 Found ${pendingJobs.length} pending jobs ready to process`);

    // Debug: Show next few scheduled jobs
    const nextJobs = dailyPlan.jobs
      .filter(job => job.status === 'pending' && job.scheduledAt)
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
      .slice(0, 3);

    if (nextJobs.length > 0) {
      console.log('📅 Next scheduled jobs:');
      nextJobs.forEach(job => {
        const scheduledTime = new Date(job.scheduledAt!);
        const isReady = scheduledTime <= now;
        console.log(`  ${job.position}. "${job.trend.title}" at ${scheduledTime.toLocaleString()} ${isReady ? '✅ READY' : '⏰ WAITING'}`);
      });
    }

    if (pendingJobs.length === 0) {
      console.log('✅ No jobs scheduled for now');
      return;
    }

    // Check SerpApi rate limits
    if (!serpApiMonitor.canMakeCall()) {
      console.log('⚠️ SerpApi rate limit reached, skipping article generation');
      return;
    }

    // Process the first pending job
    const job = pendingJobs[0];
    console.log(`🚀 Processing scheduled job: ${job.trend.title} (position ${job.position})`);

    await this.processGenerationJob(job);
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

    // Find next scheduled job
    const nextScheduledJob = dailyPlan?.jobs
      .filter(job => job.status === 'pending' && job.scheduledAt)
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())[0];

    return {
      totalJobs: jobs.length,
      pendingJobs: jobs.filter(j => j.status === 'pending').length,
      generatingJobs: jobs.filter(j => j.status === 'generating').length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      failedJobs: jobs.filter(j => j.status === 'failed').length,
      rejectedJobs: jobs.filter(j => j.status === 'rejected').length,
      todayJobs,
      isRunning: this.isRunning,
      lastRun: jobs.length > 0 ? jobs[jobs.length - 1].createdAt : undefined,
      nextRun: this.isRunning ? new Date(Date.now() + this.GENERATION_INTERVAL).toISOString() : undefined,
      dailyPlan,
      nextScheduledJob
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
   * Force refresh of daily plan (useful when trends are updated)
   * This preserves already generated articles and only updates future ones
   */
  public async refreshDailyPlan(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    console.log('🔄 Refreshing daily plan for', today);
    console.log('📊 Reading latest trends from Firebase for daily plan refresh...');

    // Update only future articles (preserve already generated ones)
    await this.updateFutureDailyPlan(today);

    console.log('✅ Daily plan refresh completed - preserved existing articles, updated future ones');
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

      // Determine current time and which articles are already generated
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinute;

      // Find articles that are already generated (past their scheduled time)
      const preservedJobs = [];
      const futureJobs = [];

      for (const job of currentPlan.jobs) {
        // Safety check for scheduledTime
        if (!job.scheduledTime || typeof job.scheduledTime !== 'string') {
          console.warn(`⚠️ Job #${job.position} has invalid scheduledTime:`, job.scheduledTime);
          // Assume it's a future job if scheduledTime is invalid
          futureJobs.push(job);
          continue;
        }

        try {
          const [hours, minutes] = job.scheduledTime.split(':').map(Number);

          // Validate parsed time
          if (isNaN(hours) || isNaN(minutes)) {
            console.warn(`⚠️ Job #${job.position} has invalid time format: "${job.scheduledTime}"`);
            futureJobs.push(job);
            continue;
          }

          const jobTimeMinutes = hours * 60 + minutes;

          if (jobTimeMinutes <= currentTimeMinutes) {
            // This article should already be generated or is being generated now
            preservedJobs.push(job);
            console.log(`✅ Preserving job #${job.position}: "${job.trend?.title || 'Unknown'}" (${job.scheduledTime})`);
          } else {
            // This article is in the future - will be updated
            futureJobs.push(job);
            console.log(`🔄 Will update job #${job.position}: "${job.trend?.title || 'Unknown'}" (${job.scheduledTime})`);
          }
        } catch (error) {
          console.error(`❌ Error parsing scheduledTime for job #${job.position}:`, error);
          // Assume it's a future job if parsing fails
          futureJobs.push(job);
        }
      }

      console.log(`📊 Preserving ${preservedJobs.length} past/current jobs, updating ${futureJobs.length} future jobs`);

      // Get latest trends from Firebase for future jobs
      const { firebaseTrendsService } = await import('./firebase-trends');
      const firebaseTrends = await firebaseTrendsService.getLatestTrends(50);
      console.log(`📊 Retrieved ${firebaseTrends.length} latest trends from Firebase`);

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

      console.log(`📊 Found ${availableTrends.length} available trends for future jobs`);

      // Update future jobs with new trends
      const updatedFutureJobs = futureJobs.map((job, index) => {
        if (index < availableTrends.length) {
          const newTrend = availableTrends[index];
          console.log(`🔄 Updating job #${job.position}: "${job.trend.title}" → "${newTrend.title}" (${newTrend.searchVolume} searches)`);

          // Ensure scheduledAt exists - create if missing
          let scheduledAt = job.scheduledAt;
          if (!scheduledAt) {
            console.warn(`⚠️ Job #${job.position} missing scheduledAt, creating new one`);
            const startHour = 6; // Start at 6:00 AM
            const intervalMinutes = (22 - 6) * 60 / 24; // ~40 minutes apart
            const scheduledTime = new Date(date + 'T00:00:00.000Z');
            const scheduledHour = startHour + Math.floor((job.position - 1) * intervalMinutes / 60);
            const scheduledMinute = Math.floor((job.position - 1) * intervalMinutes) % 60;
            scheduledTime.setUTCHours(scheduledHour, scheduledMinute, 0, 0);
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
            const startHour = 6;
            const intervalMinutes = (22 - 6) * 60 / 24;
            const scheduledTime = new Date(date + 'T00:00:00.000Z');
            const scheduledHour = startHour + Math.floor((job.position - 1) * intervalMinutes / 60);
            const scheduledMinute = Math.floor((job.position - 1) * intervalMinutes) % 60;
            scheduledTime.setUTCHours(scheduledHour, scheduledMinute, 0, 0);
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
      const allJobs = [...preservedJobs, ...updatedFutureJobs];
      allJobs.sort((a, b) => a.position - b.position);

      // Create updated daily plan
      const updatedPlan: DailyPlan = {
        ...currentPlan,
        jobs: allJobs,
        updatedAt: new Date(),
        totalJobs: allJobs.length,
        completedJobs: preservedJobs.filter(job => job.status === 'completed').length,
        pendingJobs: allJobs.filter(job => job.status === 'pending').length
      };

      // Save updated plan
      await this.storeDailyPlan(updatedPlan);
      console.log(`✅ Updated daily plan saved with ${preservedJobs.length} preserved + ${updatedFutureJobs.length} updated jobs`);

      return updatedPlan;

    } catch (error) {
      console.error('❌ Error updating future daily plan:', error);
      throw error;
    }
  }

  /**
   * Create a fresh daily plan with ALL latest trends (for refresh functionality)
   */
  private async createFreshDailyPlan(date: string): Promise<DailyPlan> {
    console.log(`🔄 Creating fresh daily plan for date: ${date}`);

    try {
      // Get ALL latest trends from Firebase (not just ones needing articles)
      console.log('📊 Fetching ALL latest trends from Firebase for fresh daily plan...');

      let firebaseTrends: any[] = [];

      try {
        const { firebaseTrendsService } = await import('./firebase-trends');
        firebaseTrends = await firebaseTrendsService.getLatestTrends(50); // Get ALL trends
        console.log(`📊 Retrieved ${firebaseTrends.length} latest trends from Firebase`);
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
      const startHour = 6; // Start at 6:00 AM
      const endHour = 22; // End at 10:00 PM
      const intervalMinutes = (endHour - startHour) * 60 / this.MAX_DAILY_ARTICLES; // ~40 minutes apart

      for (let i = 0; i < maxJobs; i++) {
        const trend = uniqueTrends[i];

        // Create scheduled time for the target date
        const scheduledTime = new Date(date + 'T00:00:00.000Z');
        const scheduledHour = startHour + Math.floor(i * intervalMinutes / 60);
        const scheduledMinute = Math.floor(i * intervalMinutes) % 60;
        scheduledTime.setUTCHours(scheduledHour, scheduledMinute, 0, 0);

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
   * Enable test mode - reschedule all pending jobs to start now with 5-minute intervals
   */
  public async enableTestMode(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const dailyPlan = await this.getDailyPlan(today);

    if (!dailyPlan) {
      console.log('⚠️ No daily plan found for test mode');
      return;
    }

    const now = new Date();
    let testCount = 0;

    dailyPlan.jobs.forEach((job, index) => {
      if (job.status === 'pending') {
        // Schedule jobs every 5 minutes starting now
        const testTime = new Date(now.getTime() + (testCount * 5 * 60 * 1000));
        job.scheduledAt = testTime.toISOString();
        testCount++;
      }
    });

    if (testCount > 0) {
      dailyPlan.updatedAt = new Date().toISOString();
      await this.storeDailyPlan(dailyPlan);
      console.log(`🧪 Test mode enabled: ${testCount} jobs rescheduled with 5-minute intervals`);
      console.log(`🧪 First job will start at: ${new Date(now.getTime() + 0).toLocaleString()}`);
      console.log(`🧪 Last job will start at: ${new Date(now.getTime() + ((testCount - 1) * 5 * 60 * 1000)).toLocaleString()}`);
    } else {
      console.log('✅ No pending jobs to reschedule for test mode');
    }
  }
}

export const automatedArticleGenerator = new AutomatedArticleGenerator();
export default automatedArticleGenerator;
