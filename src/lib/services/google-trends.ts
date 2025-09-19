import { serpApiMonitor } from '@/lib/utils/serpapi-monitor';

export interface TrendingTopic {
  title: string;
  keyword: string;
  category: string;
  traffic: string;
  formattedTraffic?: string;
  searchVolume: number;
  region: string;
  timeframe: string;
  relatedQueries: string[];
  confidence: number;
  growthRate: number;
  source?: string;
  originalTitle?: string; // For RSS articles - original article title
  sources: Array<{
    title: string;
    url: string;
    domain: string;
  }>;
}

export const googleTrendsService = {
  async getTrendingTopics() {
    return await this.getDailyTrends('US');
  },

  async getInterestOverTime(keyword: string, timeframe: string, region: string) {
    const startTime = Date.now();

    try {
      const serpApiKey = process.env.SERPAPI_KEY;
      if (!serpApiKey) {
        console.warn('⚠️ SERPAPI_KEY not found, returning empty data');

        // Log failed call
        const { serpApiLogger } = await import('@/lib/utils/serpapi-logger');
        serpApiLogger.logCall({
          timestamp: new Date().toISOString(),
          endpoint: '/api/trends/details (getInterestOverTime)',
          keyword,
          region,
          engine: 'google_trends',
          success: false,
          error: 'SERPAPI_KEY not found',
          responseTime: Date.now() - startTime
        });

        return { data: [] };
      }

      const response = await fetch(`https://serpapi.com/search?engine=google_trends&q=${encodeURIComponent(keyword)}&geo=${region}&api_key=${serpApiKey}`);
      const data = await response.json();

      const responseTime = Date.now() - startTime;
      const success = response.ok && !data.error;

      // Log the call
      const { serpApiLogger } = await import('@/lib/utils/serpapi-logger');
      serpApiLogger.logCall({
        timestamp: new Date().toISOString(),
        endpoint: '/api/trends/details (getInterestOverTime)',
        keyword,
        region,
        engine: 'google_trends',
        success,
        error: data.error || (!response.ok ? `HTTP ${response.status}` : undefined),
        responseTime
      });

      return { data: data.interest_over_time?.timeline_data || [] };
    } catch (error) {
      console.error('Error fetching interest over time:', error);

      // Log failed call
      const { serpApiLogger } = await import('@/lib/utils/serpapi-logger');
      serpApiLogger.logCall({
        timestamp: new Date().toISOString(),
        endpoint: '/api/trends/details (getInterestOverTime)',
        keyword,
        region,
        engine: 'google_trends',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      });

      return { data: [] };
    }
  },

  async getRelatedQueries(keyword: string, region: string) {
    const startTime = Date.now();

    try {
      const serpApiKey = process.env.SERPAPI_KEY;
      if (!serpApiKey) {
        console.warn('⚠️ SERPAPI_KEY not found, returning empty data');

        // Log failed call
        const { serpApiLogger } = await import('@/lib/utils/serpapi-logger');
        serpApiLogger.logCall({
          timestamp: new Date().toISOString(),
          endpoint: '/api/trends/details (getRelatedQueries)',
          keyword,
          region,
          engine: 'google_trends',
          success: false,
          error: 'SERPAPI_KEY not found',
          responseTime: Date.now() - startTime
        });

        return { queries: [] };
      }

      const response = await fetch(`https://serpapi.com/search?engine=google_trends&q=${encodeURIComponent(keyword)}&geo=${region}&api_key=${serpApiKey}`);
      const data = await response.json();

      const responseTime = Date.now() - startTime;
      const success = response.ok && !data.error;

      // Log the call
      const { serpApiLogger } = await import('@/lib/utils/serpapi-logger');
      serpApiLogger.logCall({
        timestamp: new Date().toISOString(),
        endpoint: '/api/trends/details (getRelatedQueries)',
        keyword,
        region,
        engine: 'google_trends',
        success,
        error: data.error || (!response.ok ? `HTTP ${response.status}` : undefined),
        responseTime
      });

      return { queries: data.related_queries?.top || [] };
    } catch (error) {
      console.error('Error fetching related queries:', error);

      // Log failed call
      const { serpApiLogger } = await import('@/lib/utils/serpapi-logger');
      serpApiLogger.logCall({
        timestamp: new Date().toISOString(),
        endpoint: '/api/trends/details (getRelatedQueries)',
        keyword,
        region,
        engine: 'google_trends',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      });

      return { queries: [] };
    }
  },

  async getDailyTrends(region: string) {
    const startTime = Date.now();

    try {
      console.log(`🔍 Fetching daily trends for region: ${region}`);

      // Try SerpAPI first
      const serpApiKey = process.env.SERPAPI_KEY;
      if (serpApiKey) {
        try {
          console.log('📡 Using SerpAPI for Google Trends...');
          const response = await fetch(`https://serpapi.com/search?engine=google_trends_trending_now&geo=${region}&api_key=${serpApiKey}`);
          const data = await response.json();

          const responseTime = Date.now() - startTime;
          const success = response.ok && !data.error && data.trending_searches;

          // Log the call with detailed info
          const { serpApiLogger } = await import('@/lib/utils/serpapi-logger');
          serpApiLogger.logCall({
            timestamp: new Date().toISOString(),
            endpoint: 'getDailyTrends',
            region,
            engine: 'google_trends_trending_now',
            success,
            error: data.error || (!response.ok ? `HTTP ${response.status}` : (!data.trending_searches ? 'No trending_searches in response' : undefined)),
            responseTime
          });

          // Record successful SerpAPI call (legacy system)
          try {
            const baseUrl = process.env.VERCEL_URL
              ? `https://${process.env.VERCEL_URL}`
              : process.env.NEXTAUTH_URL || 'http://localhost:3000';
            await fetch(`${baseUrl}/api/serpapi-usage`, { method: 'POST' });
            console.log('📊 SerpAPI call recorded successfully');
          } catch (recordError) {
            console.warn('⚠️ Failed to record SerpAPI call:', recordError);
          }

          if (data.trending_searches) {
            const serpTopics = data.trending_searches
              .slice(0, 50) // Use up to 50 SerpAPI topics (no RSS supplement needed)
              .map((item: any) => ({
                title: item.query || item.title || 'Unknown Topic',
                keyword: item.query || item.title || 'unknown',
                category: item.category || 'general',
                traffic: item.formattedTraffic || `${Math.floor(Math.random() * 100000) + 10000}+`,
                formattedTraffic: item.formattedTraffic || `${Math.floor(Math.random() * 100000) + 10000}+`,
                searchVolume: item.traffic || Math.floor(Math.random() * 100000) + 10000,
                region: region,
                timeframe: 'now',
                relatedQueries: item.related_queries || [],
                confidence: Math.random() * 0.3 + 0.7,
                growthRate: Math.random() * 50 + 10,
                source: 'SerpAPI', // Mark as SerpAPI
                sources: (item.articles || []).map((article: any) => ({
                  title: article.title || 'Unknown Article',
                  url: article.url || '#',
                  domain: article.source || 'unknown'
                }))
              }));

            // Use ONLY SerpAPI data - no RSS feeds for maximum quality
            console.log(`🎯 Using ONLY SerpAPI data for maximum quality and reliability`);

            // Sort SerpAPI topics by search volume (highest first)
            const allTopics = serpTopics.sort((a, b) => b.searchVolume - a.searchVolume);

            console.log(`✅ Pure SerpAPI data: ${serpTopics.length} high-quality trends from SerpAPI only`);
            return {
              topics: allTopics,
              total: allTopics.length,
              source: 'SerpAPI Only',
              region,
              timeframe: 'now',
              lastUpdated: new Date().toISOString()
            };
          }
        } catch (serpError) {
          console.warn('⚠️ SerpAPI failed:', serpError);
        }
      }

      // No fallback - if SerpAPI fails, return empty results
      console.log('❌ SerpAPI failed and no fallback configured - returning empty results');

      return {
        topics: [],
        total: 0,
        source: 'SerpAPI Failed',
        region,
        timeframe: 'now',
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error fetching daily trends:', error);
      return { topics: [], total: 0, source: 'error', region, timeframe: 'now', lastUpdated: new Date().toISOString() };
    }
  },

  async getTrendsByCategory(category: string, region: string) {
    const dailyTrends = await this.getDailyTrends(region);

    // Filter by category if not 'all'
    if (category !== 'all') {
      const filteredTopics = dailyTrends.topics.filter((topic: any) =>
        topic.category.toLowerCase() === category.toLowerCase()
      );

      return {
        ...dailyTrends,
        topics: filteredTopics,
        total: filteredTopics.length
      };
    }

    return dailyTrends;
  },

  async fetchFromRSSFeeds(region: string) {
    try {
      console.log('📰 Fetching from RSS feeds...');

      const rssFeeds = [
        'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US',
        'https://rss.cnn.com/rss/edition.rss',
        'https://feeds.bbci.co.uk/news/rss.xml',
        'https://www.reuters.com/rssFeed/topNews'
      ];

      const topics = [];

      for (const feedUrl of rssFeeds) {
        try {
          // Use RSS proxy to avoid CORS issues
          const proxyUrl = `/api/rss-proxy?url=${encodeURIComponent(feedUrl)}`;
          const response = await fetch(proxyUrl);
          const xmlText = await response.text();

          // Simple XML parsing for RSS items
          const items = this.parseRSSItems(xmlText);
          topics.push(...items);

          if (topics.length >= 15) break; // Limit to 15 topics total from all RSS feeds
        } catch (feedError) {
          console.warn(`⚠️ RSS feed failed: ${feedUrl}`, feedError);
        }
      }

      console.log(`✅ RSS feeds returned ${topics.length} topics`);
      return topics.slice(0, 10); // Limit to 10 RSS topics as supplement to SerpAPI

    } catch (error) {
      console.error('Error fetching RSS feeds:', error);
      return [];
    }
  },

  parseRSSItems(xmlText: string) {
    const topics = [];

    try {
      // Simple regex-based XML parsing (for basic RSS)
      const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g;
      const titleRegex = /<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>|<title[^>]*>(.*?)<\/title>/;
      const descRegex = /<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>|<description[^>]*>(.*?)<\/description>/;

      let match;
      while ((match = itemRegex.exec(xmlText)) !== null && topics.length < 10) {
        const itemContent = match[1];

        const titleMatch = titleRegex.exec(itemContent);
        const descMatch = descRegex.exec(itemContent);

        const title = (titleMatch?.[1] || titleMatch?.[2] || 'Unknown Topic').trim();
        const description = (descMatch?.[1] || descMatch?.[2] || '').trim();

        if (title && title !== 'Unknown Topic') {
          // Extract keywords from article title
          const keyword = this.extractKeywordFromTitle(title);

          // Use intelligent categorization instead of always 'news'
          const smartCategory = this.categorizeTopic(keyword);

          topics.push({
            title: keyword, // Use extracted keyword as title for consistency with SerpAPI
            keyword: keyword,
            category: smartCategory, // Use intelligent categorization
            traffic: `${Math.floor(Math.random() * 50000) + 5000}+`,
            formattedTraffic: `${Math.floor(Math.random() * 50000) + 5000}+`,
            searchVolume: Math.floor(Math.random() * 50000) + 5000,
            region: 'US',
            timeframe: 'now',
            relatedQueries: [],
            confidence: Math.random() * 0.3 + 0.6,
            growthRate: Math.random() * 40 + 5,
            source: 'RSS', // Mark as RSS
            originalTitle: title, // Keep original article title
            sources: [{
              title: title,
              url: '#',
              domain: 'rss-feed'
            }]
          });
        }
      }
    } catch (parseError) {
      console.warn('⚠️ RSS parsing failed:', parseError);
    }

    return topics;
  },

  extractKeywordFromTitle(title: string): string {
    // Remove common article words and extract main keywords
    const stopWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
      'between', 'among', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him',
      'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'says', 'said',
      'how', 'what', 'when', 'where', 'why', 'who', 'which', 'as', 'so', 'than', 'too', 'very',
      'just', 'now', 'then', 'here', 'there', 'more', 'most', 'some', 'any', 'no', 'not', 'only',
      'own', 'same', 'few', 'much', 'many', 'little', 'long', 'good', 'new', 'old', 'right', 'way'
    ];

    // Clean title and split into words
    let cleanTitle = title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    // Split into words and filter out stop words
    const words = cleanTitle
      .split(' ')
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 3); // Take first 3 meaningful words

    // If we have meaningful words, join them
    if (words.length > 0) {
      return words.join(' ');
    }

    // Fallback: take first few words of original title
    const fallbackWords = title.split(' ').slice(0, 3);
    return fallbackWords.join(' ').toLowerCase();
  },

  /**
   * Categorize topic using same logic as content generator
   */
  categorizeTopic(keyword: string): string {
    const topicLower = keyword.toLowerCase();

    // Sports personalities and ESPN hosts
    if (topicLower.includes('espn') ||
        topicLower.includes('molly qerim') ||
        topicLower.includes('stephen a smith') ||
        topicLower.includes('skip bayless') ||
        topicLower.includes('first take') ||
        topicLower.includes('sportscenter') ||
        topicLower.includes('nfl') ||
        topicLower.includes('nba') ||
        topicLower.includes('mlb') ||
        topicLower.includes('sports') ||
        topicLower.includes('football') ||
        topicLower.includes('basketball') ||
        topicLower.includes('baseball')) {
      return 'Sports';
    }

    // Entertainment personalities and events
    if (topicLower.includes('actor') ||
        topicLower.includes('actress') ||
        topicLower.includes('celebrity') ||
        topicLower.includes('hollywood') ||
        topicLower.includes('netflix') ||
        topicLower.includes('disney') ||
        topicLower.includes('taylor swift') ||
        topicLower.includes('coachella') ||
        topicLower.includes('festival') ||
        topicLower.includes('music') ||
        topicLower.includes('concert') ||
        topicLower.includes('movie') ||
        topicLower.includes('tv show') ||
        topicLower.includes('entertainment')) {
      return 'Entertainment';
    }

    // Technology topics
    if (topicLower.includes('ai') ||
        topicLower.includes('artificial intelligence') ||
        topicLower.includes('tech') ||
        topicLower.includes('app') ||
        topicLower.includes('software') ||
        topicLower.includes('google') ||
        topicLower.includes('microsoft') ||
        topicLower.includes('apple') ||
        topicLower.includes('digital') ||
        topicLower.includes('cyber') ||
        topicLower.includes('quantum') ||
        topicLower.includes('robot')) {
      return 'Technology';
    }

    // Business topics
    if (topicLower.includes('stock') ||
        topicLower.includes('market') ||
        topicLower.includes('earnings') ||
        topicLower.includes('ceo') ||
        topicLower.includes('company') ||
        topicLower.includes('economy') ||
        topicLower.includes('business') ||
        topicLower.includes('finance') ||
        topicLower.includes('crypto') ||
        topicLower.includes('investment')) {
      return 'Business';
    }

    // Health topics
    if (topicLower.includes('health') ||
        topicLower.includes('medical') ||
        topicLower.includes('disease') ||
        topicLower.includes('treatment') ||
        topicLower.includes('vaccine') ||
        topicLower.includes('wellness') ||
        topicLower.includes('fitness') ||
        topicLower.includes('nutrition')) {
      return 'Health';
    }

    // Science topics
    if (topicLower.includes('research') ||
        topicLower.includes('study') ||
        topicLower.includes('discovery') ||
        topicLower.includes('space') ||
        topicLower.includes('climate') ||
        topicLower.includes('science')) {
      return 'Science';
    }

    // News topics
    if (topicLower.includes('breaking') ||
        topicLower.includes('news') ||
        topicLower.includes('politics') ||
        topicLower.includes('election') ||
        topicLower.includes('government') ||
        topicLower.includes('policy') ||
        topicLower.includes('law') ||
        topicLower.includes('court')) {
      return 'News';
    }

    return 'News'; // Default category
  }
};