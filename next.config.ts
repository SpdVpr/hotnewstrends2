import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      // Perplexity API image domains
      {
        protocol: 'https',
        hostname: 'cloudfront-us-east-1.images.arcpublishing.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.abcotvs.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.macrumors.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.notebookcheck.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static.tweaktown.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.redmondpie.com',
        port: '',
        pathname: '/**',
      },
      // Wildcard pattern for any HTTPS domain (for Perplexity images)
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.apple.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.mancity.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'hips.hearstapps.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.geeky-gadgets.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'store.storeimages.cdn-apple.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  // Disable caching in development and add CSP for RSS feeds
  async headers() {
    const headers = [];

    if (process.env.NODE_ENV === 'development') {
      headers.push({
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      });
    }

    // Add CSP for RSS feeds and external APIs
    headers.push({
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: `
            default-src 'self';
            script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google-analytics.com https://www.googletagmanager.com;
            style-src 'self' 'unsafe-inline';
            img-src 'self' data: https: http:;
            font-src 'self' data:;
            connect-src 'self'
              https://www.google-analytics.com
              https://region1.google-analytics.com
              https://region2.google-analytics.com
              https://region3.google-analytics.com
              https://region4.google-analytics.com
              https://region5.google-analytics.com
              https://region6.google-analytics.com
              https://region7.google-analytics.com
              https://region8.google-analytics.com
              https://region9.google-analytics.com
              https://*.google-analytics.com
              https://analytics.google.com
              https://stats.g.doubleclick.net
              https://www.googletagmanager.com
              https://api.perplexity.ai
              https://api.unsplash.com
              https://api.pexels.com
              https://rss.cnn.com
              https://feeds.bbci.co.uk
              https://www.reuters.com
              https://serpapi.com
              https://trends.google.com
              https://www.google.com
              https://feeds.reuters.com
              https://rss.cnn.com/rss/edition.rss
              https://rss.cnn.com/rss/cnn_topstories.rss
              https://firestore.googleapis.com
              https://firebase.googleapis.com
              https://identitytoolkit.googleapis.com
              https://securetoken.googleapis.com;
            frame-src 'self';
            object-src 'none';
            base-uri 'self';
          `.replace(/\s+/g, ' ').trim()
        }
      ]
    });

    return headers;
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  // Bundle analyzer
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
