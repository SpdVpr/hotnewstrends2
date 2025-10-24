'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface CanonicalURLProps {
  /**
   * Base URL for canonical link (default: https://www.hotnewstrends.com)
   */
  baseUrl?: string;
  /**
   * Whether to include query parameters in canonical URL (default: false)
   */
  includeParams?: boolean;
  /**
   * Whether to set noindex for pages with query parameters (default: false)
   */
  noindexParams?: boolean;
}

/**
 * CanonicalURL component for managing canonical URLs and preventing duplicate content issues
 * 
 * This component dynamically adds canonical link tags and robots meta tags to prevent
 * Google Search Console issues with duplicate pages.
 * 
 * @example
 * // In pages without parameters (always canonical)
 * <CanonicalURL />
 * 
 * @example
 * // In pages with parameters (noindex for parameter versions)
 * <CanonicalURL noindexParams />
 * 
 * @example
 * // In pages where parameters should be in canonical
 * <CanonicalURL includeParams />
 */
export function CanonicalURL({ 
  baseUrl = 'https://www.hotnewstrends.com',
  includeParams = false,
  noindexParams = false
}: CanonicalURLProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Remove existing canonical and robots meta tags
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    const existingRobots = document.querySelector('meta[name="robots"]');
    
    // Build canonical URL
    let canonicalUrl = `${baseUrl}${pathname}`;
    
    const hasParams = searchParams.toString().length > 0;
    
    // If we should include params and there are params, add them
    if (includeParams && hasParams) {
      canonicalUrl += `?${searchParams.toString()}`;
    }
    // Otherwise, canonical always points to the base URL without params
    
    // Add canonical link
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = canonicalUrl;
    document.head.appendChild(link);

    // Handle robots meta tag for pages with parameters
    if (noindexParams && hasParams) {
      // If page has parameters and we want to noindex them
      if (existingRobots) {
        existingRobots.setAttribute('content', 'noindex, follow');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'robots';
        meta.content = 'noindex, follow';
        document.head.appendChild(meta);
      }
    } else {
      // Ensure robots allows indexing for canonical pages
      if (existingRobots && hasParams) {
        // Only modify if we have params and might have previously set noindex
        existingRobots.setAttribute('content', 'index, follow');
      }
    }

    // Cleanup function
    return () => {
      const canonical = document.querySelector(`link[rel="canonical"][href="${canonicalUrl}"]`);
      if (canonical) {
        canonical.remove();
      }
    };
  }, [pathname, searchParams, baseUrl, includeParams, noindexParams]);

  return null; // This component doesn't render anything
}