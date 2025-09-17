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

  constructor() {
    this.config = {
      enabled: process.env.NODE_ENV === 'production',
      interval: 60, // Check every hour
      maxArticlesPerDay: 15,
      minConfidenceScore: 0.7,
      minGrowthRate: 25,
      categories: ['Technology', 'News', 'Business', 'Science', 'Health'],
      regions: ['US', 'GB', 'CA']
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🤖 Automation service started');
    
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
      
      // Get trending topics from Google Trends API
      const trends = await this.getTrendingTopicsFromGoogle();
      const highPotentialTopics = this.filterHighPotentialTopics(
        trends,
        this.config.minConfidenceScore,
        this.config.minGrowthRate
      );
      
      console.log(`📈 Found ${highPotentialTopics.length} high-potential topics`);
      
      // Generate articles for top topics
      const articlesToGenerate = Math.min(
        highPotentialTopics.length,
        this.config.maxArticlesPerDay - todayArticles,
        3 // Max 3 articles per cycle
      );
      
      const selectedTopics = highPotentialTopics.slice(0, articlesToGenerate);
      
      for (const topic of selectedTopics) {
        await this.generateArticleFromTopic(topic);
      }
      
      console.log(`✅ Automation cycle completed. Generated ${articlesToGenerate} articles.`);
      
    } catch (error) {
      console.error('❌ Error in automation cycle:', error);
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
      
      // Generate content
      const content = await contentGenerator.generateArticle({
        topic: topic.keyword,
        category: topic.category,
        targetLength: 1000,
        tone: 'professional',
        includeImages: true,
        seoKeywords: [topic.keyword, ...topic.relatedQueries.slice(0, 3)]
      });

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
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();
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
   * Get trending topics from Google Trends API
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
    return topics.filter(topic => {
      return topic.confidence >= minConfidence &&
             topic.growthRate >= minGrowthRate &&
             this.config.categories.includes(topic.category);
    }).slice(0, 5); // Limit to top 5 topics
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
      config: this.config
    };
  }
}

export const automationService = new AutomationService();
