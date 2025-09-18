// Google Analytics and performance monitoring integration

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

interface PageViewEvent {
  page_title: string;
  page_location: string;
  page_path: string;
  content_group1?: string; // Category
  content_group2?: string; // Author
  content_group3?: string; // Article type
}

interface PerformanceMetrics {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
}

class AnalyticsManager {
  private isInitialized = false;
  private gaId: string;
  private debugMode: boolean;

  constructor() {
    this.gaId = process.env.NEXT_PUBLIC_GA_ID || '';
    this.debugMode = process.env.NODE_ENV === 'development';
  }

  // Initialize Google Analytics
  init(): void {
    if (!this.gaId || this.isInitialized) {
      if (!this.gaId) {
        console.warn('⚠️ Google Analytics ID not found - analytics disabled');
      }
      return;
    }

    try {
      // Load gtag script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaId}`;
      document.head.appendChild(script);

      // Initialize dataLayer
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };

      // Configure GA
      window.gtag('js', new Date());
      window.gtag('config', this.gaId, {
        page_title: document.title,
        page_location: window.location.href,
        debug_mode: this.debugMode,
        // Enhanced ecommerce and content grouping
        custom_map: {
          custom_parameter_1: 'article_category',
          custom_parameter_2: 'article_author',
          custom_parameter_3: 'article_read_time'
        }
      });

      this.isInitialized = true;
      console.log('📊 Google Analytics initialized');
    } catch (error) {
      console.error('Failed to initialize Google Analytics:', error);
    }
  }

  // Track page views
  trackPageView(event: PageViewEvent): void {
    if (!this.isInitialized) return;

    try {
      window.gtag('config', this.gaId, {
        page_title: event.page_title,
        page_location: event.page_location,
        page_path: event.page_path,
        content_group1: event.content_group1,
        content_group2: event.content_group2,
        content_group3: event.content_group3
      });

      if (this.debugMode) {
        console.log('📊 Page view tracked:', event);
      }
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  // Track custom events
  trackEvent(event: AnalyticsEvent): void {
    if (!this.isInitialized) return;

    try {
      window.gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.custom_parameters
      });

      if (this.debugMode) {
        console.log('📊 Event tracked:', event);
      }
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  // Track article engagement
  trackArticleView(articleData: {
    title: string;
    category: string;
    author: string;
    readTime: string;
    slug: string;
  }): void {
    this.trackEvent({
      action: 'article_view',
      category: 'engagement',
      label: articleData.slug,
      custom_parameters: {
        article_title: articleData.title,
        article_category: articleData.category,
        article_author: articleData.author,
        article_read_time: articleData.readTime
      }
    });
  }

  // Track search queries
  trackSearch(query: string, category: string, resultsCount: number): void {
    this.trackEvent({
      action: 'search',
      category: 'site_search',
      label: query,
      value: resultsCount,
      custom_parameters: {
        search_term: query,
        search_category: category,
        search_results: resultsCount
      }
    });
  }

  // Track user engagement
  trackEngagement(type: 'scroll' | 'time_on_page' | 'click', data: any): void {
    this.trackEvent({
      action: type,
      category: 'engagement',
      label: data.label || '',
      value: data.value || 0,
      custom_parameters: data.custom_parameters || {}
    });
  }

  // Track performance metrics
  trackPerformance(metric: PerformanceMetrics): void {
    this.trackEvent({
      action: 'web_vital',
      category: 'performance',
      label: metric.name,
      value: Math.round(metric.value),
      custom_parameters: {
        metric_rating: metric.rating,
        metric_delta: metric.delta,
        metric_id: metric.id
      }
    });
  }

  // Track conversion events
  trackConversion(type: 'article_share' | 'category_follow', data: any): void {
    this.trackEvent({
      action: type,
      category: 'conversion',
      label: data.label || '',
      value: data.value || 1,
      custom_parameters: data
    });
  }
}

// Performance monitoring using Web Vitals
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();

  constructor(private analytics: AnalyticsManager) {
    this.initWebVitals();
  }

  private async initWebVitals(): Promise<void> {
    try {
      // Dynamic import to avoid SSR issues
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        console.log('⚠️ Web Vitals skipped - not in browser environment');
        return;
      }

      const webVitals = await import('web-vitals');

      // Check if functions exist before calling them
      if (webVitals.onCLS) webVitals.onCLS(this.handleMetric.bind(this));
      if (webVitals.onFID) webVitals.onFID(this.handleMetric.bind(this));
      if (webVitals.onLCP) webVitals.onLCP(this.handleMetric.bind(this));
      if (webVitals.onFCP) webVitals.onFCP(this.handleMetric.bind(this));
      if (webVitals.onTTFB) webVitals.onTTFB(this.handleMetric.bind(this));

      console.log('📈 Performance monitoring initialized');
    } catch (error) {
      console.warn('Web Vitals not available:', error);
    }
  }

  private handleMetric(metric: any): void {
    const performanceMetric: PerformanceMetrics = {
      name: metric.name,
      value: metric.value,
      rating: this.getRating(metric.name, metric.value),
      delta: metric.delta,
      id: metric.id
    };

    this.metrics.set(metric.name, performanceMetric);
    this.analytics.trackPerformance(performanceMetric);

    if (process.env.NODE_ENV === 'development') {
      console.log(`📈 ${metric.name}:`, metric.value, performanceMetric.rating);
    }
  }

  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      CLS: [0.1, 0.25],
      FID: [100, 300],
      LCP: [2500, 4000],
      FCP: [1800, 3000],
      TTFB: [800, 1800]
    };

    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold[0]) return 'good';
    if (value <= threshold[1]) return 'needs-improvement';
    return 'poor';
  }

  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  // Custom performance tracking
  trackCustomMetric(name: string, value: number): void {
    const metric: PerformanceMetrics = {
      name,
      value,
      rating: 'good' // Custom metrics don't have standard ratings
    };

    this.analytics.trackPerformance(metric);
  }
}

// Singleton instances
export const analytics = new AnalyticsManager();
export const performanceMonitor = new PerformanceMonitor(analytics);

// React hooks for analytics
export function useAnalytics() {
  return {
    trackPageView: analytics.trackPageView.bind(analytics),
    trackEvent: analytics.trackEvent.bind(analytics),
    trackArticleView: analytics.trackArticleView.bind(analytics),
    trackSearch: analytics.trackSearch.bind(analytics),
    trackEngagement: analytics.trackEngagement.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics)
  };
}

// Utility functions
export function trackArticleRead(slug: string, percentage: number): void {
  analytics.trackEngagement('scroll', {
    label: slug,
    value: percentage,
    custom_parameters: {
      scroll_percentage: percentage,
      article_slug: slug
    }
  });
}

export function trackTimeOnPage(slug: string, seconds: number): void {
  analytics.trackEngagement('time_on_page', {
    label: slug,
    value: seconds,
    custom_parameters: {
      time_seconds: seconds,
      article_slug: slug
    }
  });
}

export function trackSocialShare(platform: string, url: string): void {
  analytics.trackConversion('article_share', {
    label: platform,
    custom_parameters: {
      share_platform: platform,
      share_url: url
    }
  });
}

// Initialize analytics on client side
if (typeof window !== 'undefined') {
  analytics.init();
}
