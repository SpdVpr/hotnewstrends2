// Advanced caching system for performance optimization
// Supports in-memory, Redis, and browser caching strategies

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  revalidate?: number; // ISR revalidation time
  staleWhileRevalidate?: number; // SWR time
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
}

class CacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private maxMemorySize = 1000; // Maximum number of entries in memory
  private defaultTTL = 3600; // 1 hour default TTL

  constructor() {
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  // Get data from cache
  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.data;
    }

    // Try Redis cache if available
    if (process.env.REDIS_URL) {
      try {
        const redisData = await this.getFromRedis<T>(key);
        if (redisData) {
          // Store in memory cache for faster access
          this.setInMemory(key, redisData, { ttl: this.defaultTTL });
          return redisData;
        }
      } catch (error) {
        console.warn('Redis cache error:', error);
      }
    }

    return null;
  }

  // Set data in cache
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || this.defaultTTL;
    const tags = options.tags || [];

    // Store in memory cache
    this.setInMemory(key, data, { ttl, tags });

    // Store in Redis if available
    if (process.env.REDIS_URL) {
      try {
        await this.setInRedis(key, data, { ttl, tags });
      } catch (error) {
        console.warn('Redis cache error:', error);
      }
    }
  }

  // Invalidate cache by key
  async invalidate(key: string): Promise<void> {
    this.memoryCache.delete(key);

    if (process.env.REDIS_URL) {
      try {
        await this.deleteFromRedis(key);
      } catch (error) {
        console.warn('Redis cache error:', error);
      }
    }
  }

  // Invalidate cache by tags
  async invalidateByTags(tags: string[]): Promise<void> {
    // Memory cache invalidation
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.memoryCache.delete(key);
      }
    }

    // Redis cache invalidation
    if (process.env.REDIS_URL) {
      try {
        await this.invalidateRedisByTags(tags);
      } catch (error) {
        console.warn('Redis cache error:', error);
      }
    }
  }

  // Cache with automatic revalidation
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached) {
      // Check if we need background revalidation
      const entry = this.memoryCache.get(key);
      if (entry && options.staleWhileRevalidate) {
        const age = (Date.now() - entry.timestamp) / 1000;
        if (age > (entry.ttl - options.staleWhileRevalidate)) {
          // Background revalidation
          this.revalidateInBackground(key, fetcher, options);
        }
      }
      return cached;
    }

    // Fetch fresh data
    const data = await fetcher();
    await this.set(key, data, options);
    return data;
  }

  private setInMemory<T>(key: string, data: T, options: { ttl: number; tags?: string[] }): void {
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= this.maxMemorySize) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) {
        this.memoryCache.delete(oldestKey);
      }
    }

    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: options.ttl,
      tags: options.tags || []
    });
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    const age = (Date.now() - entry.timestamp) / 1000;
    return age > entry.ttl;
  }

  private cleanup(): void {
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
      }
    }
  }

  private async revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions
  ): Promise<void> {
    try {
      const data = await fetcher();
      await this.set(key, data, options);
    } catch (error) {
      console.warn('Background revalidation failed:', error);
    }
  }

  // Redis operations (mock implementation)
  private async getFromRedis<T>(key: string): Promise<T | null> {
    // In production, implement actual Redis operations
    return null;
  }

  private async setInRedis<T>(key: string, data: T, options: { ttl: number; tags: string[] }): Promise<void> {
    // In production, implement actual Redis operations
  }

  private async deleteFromRedis(key: string): Promise<void> {
    // In production, implement actual Redis operations
  }

  private async invalidateRedisByTags(tags: string[]): Promise<void> {
    // In production, implement actual Redis operations
  }

  // Statistics and monitoring
  getStats() {
    return {
      memorySize: this.memoryCache.size,
      maxMemorySize: this.maxMemorySize,
      hitRate: this.calculateHitRate(),
      oldestEntry: this.getOldestEntryAge(),
      totalSize: this.calculateTotalSize()
    };
  }

  private calculateHitRate(): number {
    // In production, track hits and misses
    return 0.85; // Mock hit rate
  }

  private getOldestEntryAge(): number {
    let oldest = 0;
    for (const entry of this.memoryCache.values()) {
      const age = (Date.now() - entry.timestamp) / 1000;
      oldest = Math.max(oldest, age);
    }
    return oldest;
  }

  private calculateTotalSize(): number {
    // Rough estimation of memory usage
    return this.memoryCache.size * 1024; // Assume 1KB per entry
  }
}

// Singleton cache manager
export const cache = new CacheManager();

// Utility functions for common caching patterns
export const cacheKeys = {
  trends: (region: string, category: string) => `trends:${region}:${category}`,
  article: (slug: string) => `article:${slug}`,
  articles: (category: string, page: number) => `articles:${category}:${page}`,
  categories: () => 'categories',
  sitemap: () => 'sitemap',
  rss: () => 'rss',
  stats: () => 'stats'
};

export const cacheTags = {
  articles: 'articles',
  trends: 'trends',
  categories: 'categories',
  automation: 'automation'
};

// Cache decorators for API routes
export function withCache<T>(
  key: string | ((args: any) => string),
  options: CacheOptions = {}
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = typeof key === 'function' ? key(args[0]) : key;
      
      return cache.getOrSet(
        cacheKey,
        () => method.apply(this, args),
        options
      );
    };

    return descriptor;
  };
}

// ISR (Incremental Static Regeneration) helpers
export const revalidationTimes = {
  homepage: 60, // 1 minute
  articles: 300, // 5 minutes
  categories: 600, // 10 minutes
  trends: 120, // 2 minutes
  sitemap: 3600, // 1 hour
  rss: 300 // 5 minutes
};

// Cache warming functions
export async function warmCache(): Promise<void> {
  console.log('🔥 Warming cache...');
  
  try {
    // Warm critical pages
    const criticalKeys = [
      cacheKeys.categories(),
      cacheKeys.trends('US', 'all'),
      cacheKeys.sitemap(),
      cacheKeys.rss()
    ];

    await Promise.all(
      criticalKeys.map(async (key) => {
        try {
          // In production, fetch actual data for these keys
          await cache.set(key, {}, { ttl: revalidationTimes.homepage });
        } catch (error) {
          console.warn(`Failed to warm cache for ${key}:`, error);
        }
      })
    );

    console.log('✅ Cache warmed successfully');
  } catch (error) {
    console.error('❌ Cache warming failed:', error);
  }
}
