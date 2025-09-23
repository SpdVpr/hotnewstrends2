import { TwitterApi } from 'twitter-api-v2';

interface XApiConfig {
  appKey: string;
  appSecret: string;
  accessToken: string;
  accessSecret: string;
}

interface TweetData {
  title: string;
  url: string;
  category: string;
  tags?: string[];
  excerpt?: string;
  imageUrl?: string;
  content?: string;
}

interface TweetResult {
  success: boolean;
  tweetId?: string;
  tweetText?: string;
  error?: string;
  rateLimitRemaining?: number;
}

class XApiService {
  private client: TwitterApi | null = null;
  private config: XApiConfig | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      const config = {
        appKey: process.env.X_API_KEY || '',
        appSecret: process.env.X_API_SECRET || '',
        accessToken: process.env.X_ACCESS_TOKEN || '',
        accessSecret: process.env.X_ACCESS_TOKEN_SECRET || '',
      };

      // Validate all required credentials are present
      if (!config.appKey || !config.appSecret || !config.accessToken || !config.accessSecret) {
        console.warn('X API credentials not fully configured');
        return;
      }

      this.config = config;
      this.client = new TwitterApi({
        appKey: config.appKey,
        appSecret: config.appSecret,
        accessToken: config.accessToken,
        accessSecret: config.accessSecret,
      });

      console.log('X API client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize X API client:', error);
    }
  }

  /**
   * Check if X API is properly configured
   */
  isConfigured(): boolean {
    return this.client !== null && this.config !== null;
  }

  /**
   * Generate engaging tweet text from article data
   */
  private generateTweetText(data: TweetData): string {
    const { title, url, category, tags = [], excerpt, content } = data;

    // Generate smart hashtags
    const hashtags = this.generateHashtags(category, title, content, tags);
    const hashtagsText = hashtags.map(tag => `#${tag}`).join(' ');

    // Generate summary from excerpt or content
    const summary = this.generateSummary(excerpt, content);

    // Add engaging emoji based on category
    const emoji = this.getCategoryEmoji(category);

    // Calculate available space
    const urlLength = 23; // Twitter's t.co URL length
    const baseLength = hashtagsText.length + urlLength + 6; // 6 for spaces and newlines
    const availableForContent = 280 - baseLength;

    // Build tweet content
    let tweetContent = '';

    // Add emoji and title
    const titleWithEmoji = `${emoji} ${title}`;

    if (summary && (titleWithEmoji.length + summary.length + 4) <= availableForContent) {
      // Title + summary fits
      tweetContent = `${titleWithEmoji}\n\n${summary}`;
    } else if (titleWithEmoji.length <= availableForContent - 10) {
      // Just title fits
      tweetContent = titleWithEmoji;
    } else {
      // Truncate title
      const maxTitleLength = availableForContent - 10;
      tweetContent = `${emoji} ${title.substring(0, maxTitleLength - 3)}...`;
    }

    return `${tweetContent}\n\n${url}\n\n${hashtagsText}`;
  }

  /**
   * Generate smart hashtags based on content analysis
   */
  private generateHashtags(category: string, title: string, content?: string, tags?: string[]): string[] {
    const hashtags = new Set<string>();

    // Smart hashtag detection from title and content
    const smartTags = this.extractSmartHashtags(title, content);
    smartTags.forEach(tag => hashtags.add(tag));

    // Enhanced category-based hashtags
    const categoryMap: { [key: string]: string[] } = {
      'technology': ['Tech', 'Innovation', 'TechNews'],
      'news': ['Breaking', 'NewsAlert', 'WorldNews'],
      'business': ['Business', 'Finance', 'Markets'],
      'sports': ['Sports', 'Game', 'Athletics'],
      'entertainment': ['Entertainment', 'Celebrity', 'Hollywood'],
      'health': ['Health', 'Wellness', 'Healthcare'],
      'science': ['Science', 'Research', 'Discovery'],
      'general': ['News', 'Update', 'Alert']
    };

    // Add category hashtags
    const categoryKey = category.toLowerCase();
    const categoryTags = categoryMap[categoryKey] || categoryMap['general'];
    categoryTags.slice(0, 2).forEach(tag => hashtags.add(tag));

    // Always add our brand
    hashtags.add('HotNewsTrends');

    return Array.from(hashtags).slice(0, 5); // Limit to 5 hashtags
  }

  /**
   * Extract smart hashtags from content
   */
  private extractSmartHashtags(title: string, content?: string): string[] {
    const text = `${title} ${content || ''}`.toLowerCase();
    const smartTags: string[] = [];

    // Natural disasters
    if (text.includes('earthquake') || text.includes('tsunami')) smartTags.push('Earthquake', 'Tsunami');
    if (text.includes('hurricane') || text.includes('storm')) smartTags.push('Hurricane', 'Weather');

    // Sports
    if (text.includes('nfl') || text.includes('football')) smartTags.push('NFL');
    if (text.includes('nba') || text.includes('basketball')) smartTags.push('NBA');

    // Technology
    if (text.includes('ai') || text.includes('artificial intelligence')) smartTags.push('AI');
    if (text.includes('crypto') || text.includes('bitcoin')) smartTags.push('Crypto');

    // Politics
    if (text.includes('election') || text.includes('vote')) smartTags.push('Election');
    if (text.includes('ukraine') || text.includes('russia')) smartTags.push('Ukraine');

    return smartTags.slice(0, 2); // Max 2 smart tags
  }

  /**
   * Generate summary from excerpt or content
   */
  private generateSummary(excerpt?: string, content?: string): string {
    if (excerpt && excerpt.length > 20) {
      return excerpt.length > 120 ? excerpt.substring(0, 117) + '...' : excerpt;
    }

    if (content && content.length > 50) {
      // Extract first meaningful sentence
      const sentences = content.split(/[.!?]+/);
      const firstSentence = sentences[0]?.trim();
      if (firstSentence && firstSentence.length > 20 && firstSentence.length < 150) {
        return firstSentence + '.';
      }
    }

    return '';
  }

  /**
   * Get emoji for category
   */
  private getCategoryEmoji(category: string): string {
    const emojiMap: { [key: string]: string } = {
      'technology': '🚀',
      'news': '📰',
      'business': '💼',
      'sports': '⚽',
      'entertainment': '🎬',
      'health': '🏥',
      'science': '🔬',
      'general': '📢'
    };

    return emojiMap[category.toLowerCase()] || '📢';
  }

  /**
   * Upload image to X and return media ID
   */
  private async uploadImage(imageUrl: string): Promise<string> {
    try {
      // Download image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const imageBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(imageBuffer);

      // Upload to X
      const mediaId = await this.client!.v1.uploadMedia(buffer, {
        mimeType: response.headers.get('content-type') || 'image/jpeg'
      });

      return mediaId;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  }

  /**
   * Post a tweet about an article with optional image
   */
  async postTweet(articleData: TweetData): Promise<TweetResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'X API not configured'
      };
    }

    try {
      const tweetText = this.generateTweetText(articleData);

      console.log('Posting tweet:', tweetText);

      let mediaId: string | undefined;

      // Try to upload image if available
      if (articleData.imageUrl) {
        try {
          mediaId = await this.uploadImage(articleData.imageUrl);
          console.log('Image uploaded with media ID:', mediaId);
        } catch (imageError) {
          console.warn('Failed to upload image, posting without image:', imageError);
          // Continue without image
        }
      }

      // Post tweet with or without media
      const tweetOptions: any = { text: tweetText };
      if (mediaId) {
        tweetOptions.media = { media_ids: [mediaId] };
      }

      const tweet = await this.client!.v2.tweet(tweetOptions);

      return {
        success: true,
        tweetId: tweet.data.id,
        tweetText: tweetText
      };
    } catch (error: any) {
      console.error('Failed to post tweet:', error);

      const tweetText = this.generateTweetText(articleData);
      let errorMessage = 'Failed to post tweet';

      if (error.code === 403) {
        if (error.data?.detail?.includes('oauth1 app permissions')) {
          errorMessage = 'X App permissions error: App needs "Read and Write" permissions. Please check X Developer Portal.';
        } else {
          errorMessage = 'X API access forbidden. Check app permissions and status.';
        }
      } else if (error.code === 401) {
        errorMessage = 'X API authentication failed. Check API keys and tokens.';
      } else if (error.code === 429) {
        errorMessage = 'X API rate limit exceeded. Please try again later.';
        return {
          success: false,
          error: errorMessage,
          tweetText: tweetText,
          rateLimitRemaining: 0
        };
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        tweetText: tweetText
      };
    }
  }

  /**
   * Get current rate limit status
   */
  async getRateLimitStatus(): Promise<{ remaining: number; resetTime: Date } | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const rateLimits = await this.client!.v2.rateLimits();
      const tweetLimit = rateLimits['POST /2/tweets'];
      
      if (tweetLimit) {
        return {
          remaining: tweetLimit.remaining,
          resetTime: new Date(tweetLimit.reset * 1000)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get rate limit status:', error);
      return null;
    }
  }

  /**
   * Test the X API connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string; user?: any }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'X API not configured'
      };
    }

    try {
      const user = await this.client!.v2.me();
      return {
        success: true,
        user: user.data
      };
    } catch (error: any) {
      console.error('X API connection test failed:', error);
      return {
        success: false,
        error: error.message || 'Connection test failed'
      };
    }
  }

  /**
   * Get optimal hashtags for a category
   */
  private getCategoryHashtags(category: string): string[] {
    const categoryMap: Record<string, string[]> = {
      'Technology': ['tech', 'innovation', 'digital'],
      'Entertainment': ['entertainment', 'celebrity', 'showbiz'],
      'Sports': ['sports', 'athletics', 'game'],
      'Politics': ['politics', 'government', 'policy'],
      'Business': ['business', 'finance', 'economy'],
      'Health': ['health', 'wellness', 'medical'],
      'Science': ['science', 'research', 'discovery'],
      'World': ['world', 'global', 'international'],
      'Lifestyle': ['lifestyle', 'culture', 'society']
    };

    return categoryMap[category] || ['news', 'trending'];
  }
}

// Export singleton instance
export const xApiService = new XApiService();
export type { TweetData, TweetResult };
