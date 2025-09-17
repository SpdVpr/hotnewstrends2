import { NextRequest, NextResponse } from 'next/server';

// Performance monitoring and security headers middleware
export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://www.google-analytics.com https://api.perplexity.ai https://api.unsplash.com https://api.pexels.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);

  // Performance headers
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
  
  // Cache control for different routes
  const pathname = request.nextUrl.pathname;

  // In development, disable all caching to prevent stale content
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  } else {
    // Production cache control
    if (pathname.startsWith('/api/')) {
      // API routes - short cache for dynamic content
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    } else if (pathname.startsWith('/_next/static/')) {
      // Static assets - long cache
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) {
      // Images - medium cache
      response.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    } else if (pathname.startsWith('/article/')) {
      // Article pages - ISR with stale-while-revalidate
      response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    } else if (pathname === '/' || pathname.startsWith('/category/')) {
      // Homepage and category pages - frequent updates
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    } else {
      // Other pages - standard cache
      response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    }
  }

  // CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // Rate limiting headers (mock implementation)
  if (pathname.startsWith('/api/')) {
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', '99');
    response.headers.set('X-RateLimit-Reset', String(Date.now() + 60000));
  }

  // Preload critical resources
  if (pathname === '/') {
    response.headers.set('Link', [
      '</fonts/inter.woff2>; rel=preload; as=font; type=font/woff2; crossorigin',
      '</api/trends>; rel=prefetch',
      '</logo.png>; rel=preload; as=image'
    ].join(', '));
  }

  return response;
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest files
     */
    '/((?!api/|_next/static|_next/image|favicon.ico|manifest|robots.txt|sitemap.xml).*)',
  ],
};
