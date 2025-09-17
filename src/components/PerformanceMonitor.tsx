'use client';

import { useEffect } from 'react';

export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return;

    // Web Vitals monitoring
    const reportWebVitals = (metric: any) => {
      // Send to analytics service
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', metric.name, {
          event_category: 'Web Vitals',
          event_label: metric.id,
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          non_interaction: true,
        });
      }
    };

    // LCP optimization
    const optimizeLCP = () => {
      // Preload LCP image
      const lcpImage = document.querySelector('[data-lcp="true"]') as HTMLImageElement;
      if (lcpImage && lcpImage.src) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = lcpImage.src;
        link.fetchPriority = 'high';
        document.head.appendChild(link);
      }
    };

    // FCP optimization
    const optimizeFCP = () => {
      // Inline critical CSS
      const criticalCSS = `
        .aspect-video { aspect-ratio: 16/9; }
        .bg-surface { background-color: #F2F2F7; }
        .text-primary { color: #007AFF; }
      `;
      
      const style = document.createElement('style');
      style.textContent = criticalCSS;
      document.head.insertBefore(style, document.head.firstChild);
    };

    // CLS optimization
    const optimizeCLS = () => {
      // Add size attributes to images without them
      const images = document.querySelectorAll('img:not([width]):not([height])');
      images.forEach((img: any) => {
        if (img.naturalWidth && img.naturalHeight) {
          img.width = img.naturalWidth;
          img.height = img.naturalHeight;
        }
      });
    };

    // Run optimizations
    optimizeLCP();
    optimizeFCP();
    
    // Run CLS optimization after images load
    setTimeout(optimizeCLS, 100);

    // Import and use web-vitals library if available
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(reportWebVitals);
      getFID(reportWebVitals);
      getFCP(reportWebVitals);
      getLCP(reportWebVitals);
      getTTFB(reportWebVitals);
    }).catch(() => {
      // web-vitals not available, use basic performance API
      if ('performance' in window) {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'largest-contentful-paint') {
              reportWebVitals({
                name: 'LCP',
                value: entry.startTime,
                id: 'lcp-' + Date.now(),
              });
            }
          });
        });
        
        try {
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          // Observer not supported
        }
      }
    });

  }, []);

  return null; // This component doesn't render anything
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
