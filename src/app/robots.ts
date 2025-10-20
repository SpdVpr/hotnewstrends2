import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hotnewstrends.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/private/',
          '/*.json$',
          '/temp/',
          '/search?*',           // Block dynamic search URLs
          '/articles?tag=*',     // Block dynamic tag filter URLs
          '/articles?search=*',  // Block dynamic search filter URLs
          '/articles?category=*', // Block dynamic category filter URLs
        ],
        crawlDelay: 1, // Be respectful to servers
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/private/',
          '/search?*',           // Block dynamic search URLs
          '/articles?tag=*',     // Block dynamic tag filter URLs
          '/articles?search=*',  // Block dynamic search filter URLs
          '/articles?category=*', // Block dynamic category filter URLs
        ],
      },
      // AI Search Engine Crawlers
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/private/',
          '/search?*',
          '/articles?tag=*',
          '/articles?search=*',
          '/articles?category=*',
        ],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/private/',
          '/search?*',
          '/articles?tag=*',
          '/articles?search=*',
          '/articles?category=*',
        ],
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/private/',
          '/search?*',
          '/articles?tag=*',
          '/articles?search=*',
          '/articles?category=*',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/private/',
          '/search?*',
          '/articles?tag=*',
          '/articles?search=*',
          '/articles?category=*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
