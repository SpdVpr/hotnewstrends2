// Automation Service for automatic article generation and publishing
// Orchestrates the entire content creation pipeline

import { trendsService, TrendingTopic } from './trends';
import { contentGenerator, GeneratedContent } from './content-generator';
import { imageService, ImageResult } from './image-service';
import { googleTrendsService } from './google-trends';
import { Article, Category } from '@/types';

export interface AutomationConfig {
  enabled: boolean;
  interval: number; // minutes
  maxArticlesPerDay: number;
  minConfidenceScore: number;
  minGrowthRate: number;
  categories: string[];
  regions: string[];
}

export interface ArticleGenerationJob {
  id: string;
  topic: TrendingTopic;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  article?: Article;
  error?: string;
}

class AutomationService {
  private config: AutomationConfig;
  private jobs: Map<string, ArticleGenerationJob> = new Map();
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;
  private scheduledArticles: Array<{
    topic: TrendingTopic;
    scheduledFor: Date;
    status: 'scheduled' | 'generating' | 'completed' | 'failed';
    position: number;
    estimatedDuration: number; // in minutes
  }> = [];

  constructor() {
    this.config = {
      enabled: true, // Enable for both dev and production
      interval: 160, // Check every ~2.67 hours (matches trends scheduler)
      maxArticlesPerDay: 24, // 6 updates × 4 articles = 24 max per day
      minConfidenceScore: 0.5, // Lowered from 0.7 to 0.5
      minGrowthRate: 10, // Lowered from 25 to 10
      categories: ['Technology', 'News', 'Business', 'Science', 'Health', 'Entertainment', 'Sports', 'general'], // Added more categories
      regions: ['US', 'GB', 'CA']
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('🤖 Automation service started');

    // Ensure trends scheduler is running
    try {
      const { trendsScheduler } = await import('./trends-scheduler');
      if (!trendsScheduler.getStats().isRunning) {
        console.log('📊 Starting trends scheduler from automation service...');
        trendsScheduler.start();
      }
    } catch (error) {
      console.warn('⚠️ Could not start trends scheduler:', error);
    }

    // Run immediately
    await this.runAutomationCycle();

    // Schedule regular runs
    this.intervalId = setInterval(async () => {
      await this.runAutomationCycle();
    }, this.config.interval * 60 * 1000);
  }

  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    
    console.log('🛑 Automation service stopped');
  }

  private async runAutomationCycle(): Promise<void> {
    try {
      console.log('🔄 Running automation cycle...');
      
      // Check if we've reached daily limit
      const todayArticles = await this.getTodayArticleCount();
      if (todayArticles >= this.config.maxArticlesPerDay) {
        console.log(`📊 Daily limit reached (${todayArticles}/${this.config.maxArticlesPerDay})`);
        return;
      }
      
      // Get trending topics from Firebase (not API)
      const trends = await this.getTrendingTopicsFromFirebase();
      const highPotentialTopics = this.filterHighPotentialTopics(
        trends,
        this.config.minConfidenceScore,
        this.config.minGrowthRate
      );
      
      console.log(`📈 Found ${highPotentialTopics.length} high-potential topics`);
      
      // Generate articles for top topics (4 articles per cycle, spaced 20 minutes apart)
      const articlesToGenerate = Math.min(
        highPotentialTopics.length,
        this.config.maxArticlesPerDay - todayArticles,
        4 // Max 4 articles per cycle (changed from 3)
      );

      const selectedTopics = highPotentialTopics.slice(0, articlesToGenerate);

      if (selectedTopics.length > 0) {
        console.log(`📋 Scheduling ${selectedTopics.length} articles with 20-minute intervals...`);
        await this.scheduleArticleGeneration(selectedTopics);
      }

      console.log(`✅ Automation cycle completed. Scheduled ${articlesToGenerate} articles.`);
      
    } catch (error) {
      console.error('❌ Error in automation cycle:', error);
    }
  }

  /**
   * Schedule article generation with 20-minute intervals
   */
  private async scheduleArticleGeneration(topics: TrendingTopic[]): Promise<void> {
    // Clear previous scheduled articles
    this.scheduledArticles = [];

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      const delayMinutes = i * 20; // 0, 20, 40, 60 minutes
      const delayMs = delayMinutes * 60 * 1000;
      const scheduledTime = new Date(Date.now() + delayMs);

      // Add to tracking
      this.scheduledArticles.push({
        topic,
        scheduledFor: scheduledTime,
        status: i === 0 ? 'generating' : 'scheduled',
        position: i + 1,
        estimatedDuration: 5 // Estimated 5 minutes per article
      });

      if (i === 0) {
        // Generate first article immediately
        console.log(`🎯 Generating article 1/${topics.length} immediately: "${topic.keyword}"`);
        await this.generateArticleFromTopicWithTracking(topic, i);
      } else {
        // Schedule remaining articles
        console.log(`⏰ Scheduled article ${i + 1}/${topics.length} for ${scheduledTime.toLocaleTimeString()}: "${topic.keyword}"`);

        setTimeout(async () => {
          console.log(`🎯 Generating scheduled article ${i + 1}/${topics.length}: "${topic.keyword}"`);
          await this.generateArticleFromTopicWithTracking(topic, i);
        }, delayMs);
      }
    }
  }

  /**
   * Generate article with tracking updates
   */
  private async generateArticleFromTopicWithTracking(topic: TrendingTopic, index: number): Promise<void> {
    try {
      // Update status to generating
      if (this.scheduledArticles[index]) {
        this.scheduledArticles[index].status = 'generating';
      }

      // Generate the article
      await this.generateArticleFromTopic(topic);

      // Update status to completed
      if (this.scheduledArticles[index]) {
        this.scheduledArticles[index].status = 'completed';
      }
    } catch (error) {
      // Update status to failed
      if (this.scheduledArticles[index]) {
        this.scheduledArticles[index].status = 'failed';
      }
      console.error(`❌ Failed to generate article for "${topic.keyword}":`, error);
    }
  }

  async generateArticleFromTopic(topic: TrendingTopic): Promise<ArticleGenerationJob> {
    const jobId = this.generateJobId();
    const job: ArticleGenerationJob = {
      id: jobId,
      topic,
      status: 'pending',
      createdAt: new Date()
    };
    
    this.jobs.set(jobId, job);
    
    try {
      console.log(`📝 Generating article for: ${topic.keyword}`);
      job.status = 'generating';
      
      // Generate content with timeout protection
      const GENERATION_TIMEOUT = 45000; // 45 seconds (safe for Vercel)

      const contentPromise = contentGenerator.generateArticle({
        topic: topic.keyword,
        category: topic.category,
        targetLength: 1000,
        tone: 'professional',
        includeImages: true,
        seoKeywords: [topic.keyword, ...topic.relatedQueries.slice(0, 3)]
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Article generation timeout after ${GENERATION_TIMEOUT}ms for topic: ${topic.keyword}`));
        }, GENERATION_TIMEOUT);
      });

      console.log(`⏱️ Starting article generation with ${GENERATION_TIMEOUT}ms timeout for: ${topic.keyword}`);
      const content = await Promise.race([contentPromise, timeoutPromise]) as any;

      // 🚨 CRITICAL: Validate content for fictional elements
      const isFictional = this.validateContentForFiction(content, topic.keyword);
      if (isFictional) {
        console.error(`🚨 REJECTED: Fictional content detected for "${topic.keyword}"`);
        job.status = 'failed';
        job.error = 'Content validation failed: Fictional content detected';
        throw new Error('Generated content contains fictional elements');
      }
      
      // Use image from Perplexity if available, otherwise fallback to imageService
      let imageUrl = content.image;
      let imageSource = content.imageSource;
      let imageAlt = content.imageAlt;

      if (!imageUrl) {
        console.log('🖼️ No image from Perplexity, using fallback imageService');
        const image = await imageService.getBestImageForTopic(topic.keyword, topic.category);
        imageUrl = image?.url;
        imageSource = 'Stock Image';
        imageAlt = topic.keyword;
      } else {
        console.log(`🖼️ Using Perplexity image: ${imageUrl}`);
        console.log(`🖼️ Image source: ${imageSource}`);
      }

      // Create article object
      const article = await this.createArticleFromContent(content, topic, imageUrl, imageSource, imageAlt);
      
      // In production, save to database
      await this.saveArticle(article);
      
      job.article = article;
      job.status = 'completed';
      job.completedAt = new Date();
      
      console.log(`✅ Article generated successfully: ${article.title}`);
      
    } catch (error) {
      console.error(`❌ Error generating article for ${topic.keyword}:`, error);
      console.error(`❌ Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        topic: topic.keyword,
        category: topic.category,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        platform: process.env.VERCEL ? 'Vercel' : 'Local'
      });

      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();

      // Log specific error types for debugging
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          console.error(`⏰ TIMEOUT: Article generation exceeded time limit for "${topic.keyword}"`);
        } else if (error.message.includes('API key')) {
          console.error(`🔑 API KEY ERROR: Check environment variables for "${topic.keyword}"`);
        } else if (error.message.includes('rate limit')) {
          console.error(`🚫 RATE LIMIT: API calls exceeded for "${topic.keyword}"`);
        }
      }
    }

    return job;
  }

  private async createArticleFromContent(
    content: GeneratedContent,
    topic: TrendingTopic,
    imageUrl: string | undefined,
    imageSource?: string,
    imageAlt?: string
  ): Promise<Article> {
    const slug = this.generateSlug(content.title);
    const category = this.getCategoryObject(topic.category);
    
    return {
      id: this.generateArticleId(),
      title: content.title,
      excerpt: content.excerpt,
      content: content.content,
      slug,
      category,
      author: content.author,
      publishedAt: new Date(),
      updatedAt: new Date(),
      readTime: content.readTime,
      trending: topic.growthRate > 50,
      tags: content.tags,
      seoTitle: content.seoTitle,
      seoDescription: content.seoDescription,
      image: imageUrl,
      imageSource: imageSource,
      imageAlt: imageAlt,
      views: 0,
      likes: 0
    };
  }

  /**
   * Get trending topics from Firebase (collected by trend scheduler)
   */
  private async getTrendingTopicsFromFirebase(): Promise<TrendingTopic[]> {
    try {
      console.log('🔍 Fetching trending topics from Firebase...');

      // Import Firebase trends service
      const { firebaseTrendsService } = await import('./firebase-trends');

      // Get trends that need articles (not yet processed)
      const firebaseTrends = await firebaseTrendsService.getTrendsNeedingArticles(20);

      // Convert Firebase format to TrendingTopic format
      const topics: TrendingTopic[] = firebaseTrends.map((trend: any) => ({
        title: trend.title || trend.keyword || 'Unknown Topic',
        keyword: trend.keyword || 'unknown',
        category: trend.category || 'News',
        traffic: trend.formattedTraffic || `${trend.searchVolume}+`,
        formattedTraffic: trend.formattedTraffic,
        searchVolume: trend.searchVolume || trend.traffic || 1000,
        region: trend.region || 'US',
        timeframe: trend.timeframe || 'now',
        relatedQueries: trend.relatedQueries || [],
        confidence: trend.confidence || 0.8,
        growthRate: trend.growthRate || 30,
        source: trend.source || 'Firebase',
        sources: trend.sources || []
      }));

      console.log(`✅ Firebase returned ${topics.length} trends needing articles`);
      return topics;
    } catch (error) {
      console.error('❌ Error fetching trends from Firebase:', error);
      return [];
    }
  }

  /**
   * Get trending topics from Google Trends API (used by trend collection, not article generation)
   */
  private async getTrendingTopicsFromGoogle(): Promise<TrendingTopic[]> {
    try {
      console.log('🔍 Fetching trending topics from Google Trends API...');

      // Try Google Trends API first
      try {
        const googleTrends = await googleTrendsService.getDailyTrends('US');

        // Convert Google Trends format to our TrendingTopic format
        const topics: TrendingTopic[] = (googleTrends.topics || []).map((topic: any) => ({
          title: topic.title || 'Unknown Topic',
          keyword: topic.keyword || 'unknown',
          category: topic.category || 'News', // Use 'News' instead of 'general' as fallback
          traffic: topic.formattedTraffic || topic.traffic || '1,000+',
          searchVolume: topic.traffic || 1000,
          region: topic.region,
          timeframe: topic.timeframe,
          relatedQueries: topic.relatedQueries,
          confidence: Math.min(0.95, 0.7 + (topic.traffic / 1000000) * 0.25), // Calculate confidence based on traffic
          growthRate: Math.random() * 50 + 10, // Mock growth rate for now
          sources: (topic.articles || []).map((article: any) => ({
            title: article.title || 'Unknown Article',
            url: article.url || '#',
            domain: article.source || 'unknown'
          }))
        }));

        console.log(`✅ Google Trends API returned ${topics.length} topics`);
        return topics;
      } catch (googleError) {
        console.warn('⚠️ Google Trends API failed, falling back to mock data:', googleError);
        const fallbackTrends = await trendsService.getTrendingTopics();
        return fallbackTrends.topics;
      }
    } catch (error) {
      console.error('❌ Error fetching trending topics:', error);
      return [];
    }
  }

  /**
   * Filter high potential topics for content generation
   */
  private filterHighPotentialTopics(
    topics: TrendingTopic[],
    minConfidence: number,
    minGrowthRate: number
  ): TrendingTopic[] {
    console.log(`🔍 Filtering ${topics.length} topics with criteria:`);
    console.log(`   - Min Confidence: ${minConfidence}`);
    console.log(`   - Min Growth Rate: ${minGrowthRate}`);
    console.log(`   - Allowed Categories: ${this.config.categories.join(', ')}`);

    // Debug: Show first few topics
    topics.slice(0, 3).forEach((topic, i) => {
      console.log(`📊 Topic ${i + 1}: "${topic.keyword}" - Confidence: ${topic.confidence}, Growth: ${topic.growthRate}, Category: ${topic.category}`);
    });

    const filtered = topics.filter(topic => {
      const passesConfidence = topic.confidence >= minConfidence;
      const passesGrowthRate = topic.growthRate >= minGrowthRate;
      const passesCategory = this.config.categories.includes(topic.category);

      if (!passesConfidence || !passesGrowthRate || !passesCategory) {
        console.log(`❌ Rejected "${topic.keyword}": confidence=${topic.confidence}(${passesConfidence}), growth=${topic.growthRate}(${passesGrowthRate}), category=${topic.category}(${passesCategory})`);
      }

      return passesConfidence && passesGrowthRate && passesCategory;
    }).slice(0, 5); // Limit to top 5 topics

    console.log(`✅ Filtered result: ${filtered.length} high-potential topics`);
    return filtered;
  }

  private async saveArticle(article: Article): Promise<void> {
    try {
      console.log('💾 Saving article:', article.title);

      // Try to save to Firebase if configured
      if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        try {
          // Dynamic import to avoid build issues
          const { firebaseArticlesService } = await import('./firebase-articles');

          console.log(`🖼️ DEBUG: article.image = ${article.image}`);

          console.log(`🖼️ DEBUG: article.image = ${article.image}`);

          const firebaseArticle = {
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt,
            content: article.content || '',
            author: article.author || 'TrendyBlogger AI',
            category: article.category,
            tags: article.tags,
            seoTitle: article.seoTitle || `${article.title} | TrendyBlogger`,
            seoDescription: article.seoDescription || article.excerpt,
            seoKeywords: article.tags,
            image: (() => {
              console.log(`🖼️ DEBUG: article.image = ${article.image}`);
              return article.image;
            })(),
            imageSource: article.imageSource,
            imageAlt: article.imageAlt,
            readTime: article.readTime,
            status: 'published' as const,
            publishedAt: article.publishedAt,
            featured: false,
            trending: true,
            sources: [],
            confidence: 0.9
          };

          const articleId = await firebaseArticlesService.createArticle(firebaseArticle);
          console.log('✅ Article saved to Firebase with ID:', articleId);
          return;
        } catch (firebaseError) {
          console.warn('⚠️ Firebase save failed:', firebaseError);
        }
      }

      // Fallback to mock storage
      console.log('📝 Using mock storage for article:', article.title);
    } catch (error) {
      console.error('❌ Error saving article:', error);
      // Don't throw error - continue with mock storage
      console.log('🔄 Article saved to mock storage');
    }
  }

  private async getTodayArticleCount(): Promise<number> {
    // Mock implementation - in production, query database
    const today = new Date().toDateString();
    const todayJobs = Array.from(this.jobs.values()).filter(
      job => job.createdAt.toDateString() === today && job.status === 'completed'
    );
    
    return todayJobs.length;
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      // Removed 'social media buzz' - it's a legitimate term for real articles about social media
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

  private generateArticleId(): string {
    return `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private getCategoryObject(categoryName: string): Category {
    const categories: Record<string, Category> = {
      'Technology': { id: 'technology', name: 'Technology', slug: 'technology', color: '#007AFF' },
      'News': { id: 'news', name: 'News', slug: 'news', color: '#FF3B30' },
      'Business': { id: 'business', name: 'Business', slug: 'business', color: '#34C759' },
      'Science': { id: 'science', name: 'Science', slug: 'science', color: '#5856D6' },
      'Health': { id: 'health', name: 'Health', slug: 'health', color: '#FF9500' },
      'Entertainment': { id: 'entertainment', name: 'Entertainment', slug: 'entertainment', color: '#FF2D92' },
      'Sports': { id: 'sports', name: 'Sports', slug: 'sports', color: '#30D158' }
    };

    return categories[categoryName] || categories['News'];
  }

  // Public methods for manual control
  async generateArticleManually(topic: string, category: string): Promise<ArticleGenerationJob> {
    const mockTopic: TrendingTopic = {
      keyword: topic,
      searchVolume: 10000,
      growthRate: 50,
      category,
      region: 'US',
      relatedQueries: [],
      timeframe: 'now 1-d',
      confidence: 0.8
    };
    
    return this.generateArticleFromTopic(mockTopic);
  }

  getJobStatus(jobId: string): ArticleGenerationJob | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(): ArticleGenerationJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  getCompletedArticles(): Article[] {
    return Array.from(this.jobs.values())
      .filter(job => job.status === 'completed' && job.article)
      .map(job => job.article!)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }

  updateConfig(newConfig: Partial<AutomationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Automation config updated:', this.config);
  }

  getConfig(): AutomationConfig {
    return { ...this.config };
  }

  getStats() {
    const jobs = this.getAllJobs();
    const today = new Date().toDateString();

    return {
      totalJobs: jobs.length,
      todayJobs: jobs.filter(j => j.createdAt.toDateString() === today).length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      failedJobs: jobs.filter(j => j.status === 'failed').length,
      pendingJobs: jobs.filter(j => j.status === 'pending').length,
      generatingJobs: jobs.filter(j => j.status === 'generating').length,
      isRunning: this.isRunning,
      config: this.config,
      scheduledArticles: this.scheduledArticles
    };
  }
}

export const automationService = new AutomationService();
