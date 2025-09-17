'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
}

interface PerformanceData {
  metrics: PerformanceMetric[];
  sessionId: string;
  timestamp: number;
}

export function usePerformanceTracking() {
  const pathname = usePathname();
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const sessionId = useRef<string>('');
  const metricsBuffer = useRef<PerformanceMetric[]>([]);
  const sendTimeout = useRef<NodeJS.Timeout | null>(null);

  // Generate session ID
  useEffect(() => {
    if (!sessionId.current) {
      sessionId.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }, []);

  // Initialize Web Vitals tracking
  useEffect(() => {
    let mounted = true;

    const initWebVitals = async () => {
      try {
        const { onCLS, onFID, onFCP, onLCP, onTTFB } = await import('web-vitals');

        const handleMetric = (metric: any) => {
          if (!mounted) return;

          const performanceMetric: PerformanceMetric = {
            name: metric.name,
            value: metric.value,
            rating: getRating(metric.name, metric.value),
            delta: metric.delta,
            id: metric.id
          };

          // Add to buffer
          metricsBuffer.current.push(performanceMetric);
          setMetrics(prev => [...prev, performanceMetric]);

          // Schedule send (debounced)
          if (sendTimeout.current) {
            clearTimeout(sendTimeout.current);
          }
          sendTimeout.current = setTimeout(() => {
            sendMetrics();
          }, 1000);
        };

        // Track Core Web Vitals
        onCLS(handleMetric);
        onFID(handleMetric);
        onLCP(handleMetric);

        // Track other important metrics
        onFCP(handleMetric);
        onTTFB(handleMetric);

      } catch (error) {
        console.warn('Web Vitals not available:', error);
      }
    };

    initWebVitals();

    return () => {
      mounted = false;
      if (sendTimeout.current) {
        clearTimeout(sendTimeout.current);
      }
    };
  }, []);

  // Track custom performance metrics
  const trackCustomMetric = (name: string, value: number, rating?: 'good' | 'needs-improvement' | 'poor') => {
    const metric: PerformanceMetric = {
      name,
      value,
      rating: rating || 'good'
    };

    metricsBuffer.current.push(metric);
    setMetrics(prev => [...prev, metric]);

    // Schedule send
    if (sendTimeout.current) {
      clearTimeout(sendTimeout.current);
    }
    sendTimeout.current = setTimeout(() => {
      sendMetrics();
    }, 1000);
  };

  // Track page load time
  const trackPageLoad = () => {
    if (typeof window === 'undefined') return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      trackCustomMetric('page_load_time', loadTime, getLoadTimeRating(loadTime));
    }
  };

  // Track resource loading times
  const trackResourceTiming = () => {
    if (typeof window === 'undefined') return;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    // Track critical resources
    const criticalResources = resources.filter(resource => 
      resource.name.includes('.css') || 
      resource.name.includes('.js') || 
      resource.name.includes('font')
    );

    criticalResources.forEach(resource => {
      const loadTime = resource.responseEnd - resource.fetchStart;
      const resourceType = getResourceType(resource.name);
      trackCustomMetric(`${resourceType}_load_time`, loadTime, getResourceLoadRating(loadTime, resourceType));
    });
  };

  // Track user interactions
  const trackInteraction = (type: 'click' | 'scroll' | 'input', target?: string) => {
    const startTime = performance.now();
    
    // Measure interaction delay (simplified)
    requestAnimationFrame(() => {
      const delay = performance.now() - startTime;
      trackCustomMetric(`${type}_delay`, delay, delay < 100 ? 'good' : delay < 300 ? 'needs-improvement' : 'poor');
    });
  };

  // Send metrics to server
  const sendMetrics = async () => {
    if (metricsBuffer.current.length === 0 || !sessionId.current) return;

    const data: PerformanceData = {
      metrics: [...metricsBuffer.current],
      sessionId: sessionId.current,
      timestamp: Date.now()
    };

    try {
      await fetch('/api/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      // Clear buffer after successful send
      metricsBuffer.current = [];
    } catch (error) {
      console.warn('Failed to send performance metrics:', error);
    }
  };

  // Send metrics on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (metricsBuffer.current.length > 0) {
        // Use sendBeacon for reliable delivery
        const data = JSON.stringify({
          metrics: metricsBuffer.current,
          sessionId: sessionId.current,
          timestamp: Date.now()
        });

        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/performance', data);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Track page changes
  useEffect(() => {
    trackPageLoad();
    trackResourceTiming();
  }, [pathname]);

  return {
    metrics,
    trackCustomMetric,
    trackPageLoad,
    trackResourceTiming,
    trackInteraction,
    sendMetrics
  };
}

// Helper functions
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
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

function getLoadTimeRating(time: number): 'good' | 'needs-improvement' | 'poor' {
  if (time <= 1000) return 'good';
  if (time <= 3000) return 'needs-improvement';
  return 'poor';
}

function getResourceType(url: string): string {
  if (url.includes('.css')) return 'css';
  if (url.includes('.js')) return 'js';
  if (url.includes('font')) return 'font';
  if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
  return 'other';
}

function getResourceLoadRating(time: number, type: string): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = {
    css: [500, 1000],
    js: [1000, 2000],
    font: [1000, 2000],
    image: [1500, 3000],
    other: [1000, 2000]
  };

  const threshold = thresholds[type as keyof typeof thresholds] || thresholds.other;
  
  if (time <= threshold[0]) return 'good';
  if (time <= threshold[1]) return 'needs-improvement';
  return 'poor';
}
