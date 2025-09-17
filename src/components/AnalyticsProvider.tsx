'use client';

import React, { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { analytics, performanceMonitor } from '@/lib/analytics';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize analytics on mount
    analytics.init();
  }, []);

  useEffect(() => {
    // Track page views on route changes
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    
    analytics.trackPageView({
      page_title: document.title,
      page_location: window.location.href,
      page_path: url,
      content_group1: getContentGroup1(pathname),
      content_group2: getContentGroup2(pathname),
      content_group3: getContentGroup3(pathname)
    });
  }, [pathname, searchParams]);

  return <>{children}</>;
};

// Helper functions to determine content groups
function getContentGroup1(pathname: string): string {
  if (pathname.startsWith('/article/')) return 'Article';
  if (pathname.startsWith('/category/')) return 'Category';
  if (pathname.startsWith('/search')) return 'Search';
  if (pathname.startsWith('/admin')) return 'Admin';
  if (pathname === '/') return 'Homepage';
  return 'Other';
}

function getContentGroup2(pathname: string): string {
  if (pathname.startsWith('/category/')) {
    const category = pathname.split('/')[2];
    return category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Unknown';
  }
  return 'N/A';
}

function getContentGroup3(pathname: string): string {
  if (pathname.startsWith('/article/')) return 'News Article';
  if (pathname.startsWith('/category/')) return 'Category Page';
  if (pathname.startsWith('/search')) return 'Search Results';
  return 'Static Page';
}
