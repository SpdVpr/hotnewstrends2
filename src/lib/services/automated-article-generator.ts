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
  error?: string;
  articleId?: string;
  template?: string;
  qualityScore?: QualityScore;
  retryCount?: number;
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
}

class AutomatedArticleGenerator {
  private readonly STORAGE_KEY = 'article_generation_jobs';
  private readonly MAX_DAILY_ARTICLES = 20; // Increased for higher volume
  private readonly GENERATION_INTERVAL = 15 * 60 * 1000; // 15 minutes for faster processing
  private readonly MIN_QUALITY_SCORE = 75; // Minimum quality threshold
  private readonly MAX_RETRIES = 2; // Maximum retry attempts per article
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

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
   * Process new trends and generate articles
   */
  private async processNewTrends(): Promise<void> {
    try {
      console.log('🔍 Checking for new trends to generate articles...');

      // Check if we can make more articles today
      const todayCount = this.getTodayJobCount();
      if (todayCount >= this.MAX_DAILY_ARTICLES) {
        console.log(`⚠️ Daily article limit reached: ${todayCount}/${this.MAX_DAILY_ARTICLES}`);
        return;
      }

      // Check SerpApi rate limits
      if (!serpApiMonitor.canMakeCall()) {
        console.log('⚠️ SerpApi rate limit reached, skipping article generation');
        return;
      }

      // Get trends that need articles
      const trendsNeedingArticles = trendTracker.getTrendsNeedingArticles();
      
      if (trendsNeedingArticles.length === 0) {
        console.log('✅ No new trends need articles');
        return;
      }

      // Sort by traffic (highest first) and take top trends
      const topTrends = trendsNeedingArticles
        .sort((a, b) => b.traffic - a.traffic)
        .slice(0, this.MAX_DAILY_ARTICLES - todayCount);

      console.log(`📝 Generating articles for ${topTrends.length} top trends...`);

      // Generate articles for top trends
      for (const trend of topTrends) {
        await this.generateArticleForTrend(trend);
        
        // Small delay between generations
        await this.delay(5000); // 5 seconds
      }

    } catch (error) {
      console.error('❌ Error processing new trends:', error);
    }
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
      this.updateJob(job);

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

      // 🚨 CRITICAL: Validate content for fictional elements
      const isFictional = this.validateContentForFiction(generatedContent, job.trend.title);
      if (isFictional) {
        console.error(`🚨 REJECTED: Fictional content detected for "${job.trend.title}"`);
        job.status = 'failed';
        job.error = 'Content validation failed: Fictional content detected';
        job.completedAt = new Date().toISOString();
        this.updateJob(job);
        return;
      }

      // Quality check
      job.status = 'quality_check';
      this.updateJob(job);

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
        const finalCategory = aiCategory || job.trend.category || 'News';

        console.log(`🎯 Category selection: AI suggested "${generatedContent.category}", trend category "${job.trend.category}", using "${finalCategory}"`);

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

          // Category as string (same as manual)
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
            console.log(`🖼️ DEBUG: fallback image = ${this.getDefaultImage(categoryObj.id)}`);
            const finalImage = generatedContent.image || this.getDefaultImage(categoryObj.id);
            console.log(`🖼️ DEBUG: final image = ${finalImage}`);
            return finalImage;
          })()
        };

        // Call article creation API directly through Firebase
        const articleId = await this.createArticleDirectly(articleData);

        if (!articleId) {
          throw new Error('Article creation failed');
        }

        // Mark as completed
        job.status = 'completed';
        job.completedAt = new Date().toISOString();
        job.articleId = articleId;
        this.updateJob(job);

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
          this.updateJob(job);

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
        this.updateJob(job);

        console.error(`❌ Failed to generate article for "${job.trend.title}" after ${this.MAX_RETRIES} retries:`, error);
      }
    }
  }

  /**
   * Get generation statistics
   */
  getStats(): GenerationStats {
    const jobs = this.getStoredJobs();
    const todayJobs = this.getTodayJobCount();

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
      nextRun: this.isRunning ? new Date(Date.now() + this.GENERATION_INTERVAL).toISOString() : undefined
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
   * Update existing job
   */
  private updateJob(updatedJob: ArticleGenerationJob): void {
    const jobs = this.getStoredJobs();
    const index = jobs.findIndex(j => j.id === updatedJob.id);
    
    if (index !== -1) {
      jobs[index] = updatedJob;
      this.storeJobs(jobs);
    }
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
    const title = content.title?.toLowerCase() || '';
    const contentText = content.content?.toLowerCase() || '';

    // Forbidden phrases that indicate fictional content
    const forbiddenPhrases = [
      'cryptic post',
      'mysterious post',
      'social media frenzy',
      'sparks controversy',
      'fans speculate',
      'mysterious message',
      'cryptic message',
      'social media buzz',
      'internet frenzy',
      'viral post',
      'shocking revelation'
    ];

    // Check for fictional phrases
    for (const phrase of forbiddenPhrases) {
      if (title.includes(phrase) || contentText.includes(phrase)) {
        console.error(`🚨 FICTION DETECTED: "${phrase}" found in content for topic "${topic}"`);
        return true;
      }
    }

    // Additional check for person-related topics
    if (this.isPersonTopic(topic)) {
      // If it's about a person, check for death-related content validation
      const hasDeathKeywords = contentText.includes('died') ||
                              contentText.includes('death') ||
                              contentText.includes('passed away') ||
                              contentText.includes('obituary');

      const hasFictionalElements = title.includes('sparks') ||
                                  title.includes('mysterious') ||
                                  title.includes('cryptic');

      if (hasFictionalElements && !hasDeathKeywords) {
        console.error(`🚨 PERSON FICTION DETECTED: Fictional story about person "${topic}" without verified facts`);
        return true;
      }
    }

    return false;
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
   * Generate article from Firebase trend data
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
    try {
      // Convert trend data to TrackedTrend format
      const trend: TrackedTrend = {
        id: `trend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: trendData.topic,
        slug: trendData.keyword.toLowerCase().replace(/\s+/g, '-'),
        category: trendData.category,
        formattedTraffic: trendData.traffic,
        traffic: trendData.searchVolume,
        source: 'Firebase',
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        articleGenerated: false,
        hash: `${trendData.keyword}_${trendData.category}`.toLowerCase()
      };

      // Create and process job
      const job: ArticleGenerationJob = {
        id: `job_${Date.now()}_${trend.id}`,
        trendId: trend.id,
        trend,
        status: 'pending',
        createdAt: new Date().toISOString(),
        retryCount: 0
      };

      // Store job
      this.storeJob(job);
      console.log(`📋 Created generation job for Firebase trend: "${trend.title}"`);

      // Process job immediately and wait for completion
      await this.processGenerationJob(job);

      // Wait for job to complete
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max

      while (attempts < maxAttempts && job.status !== 'completed' && job.status !== 'failed') {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        attempts++;
      }

      return job;
    } catch (error) {
      console.error('❌ Error generating article from trend data:', error);
      return null;
    }
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
}

export const automatedArticleGenerator = new AutomatedArticleGenerator();
export default automatedArticleGenerator;
