import { NextRequest, NextResponse } from 'next/server';

// Allowed RSS feed URLs for security
const ALLOWED_RSS_FEEDS = [
  'https://rss.cnn.com/rss/edition.rss',
  'https://rss.cnn.com/rss/cnn_topstories.rss',
  'https://feeds.bbci.co.uk/news/rss.xml',
  'https://feeds.reuters.com/reuters/topNews',
  'https://www.reuters.com/rssFeed/topNews',
  'https://trends.google.com/trends/trendingsearches/daily/rss',
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const feedUrl = searchParams.get('url');

  if (!feedUrl) {
    return NextResponse.json(
      { error: 'Missing RSS feed URL parameter' },
      { status: 400 }
    );
  }

  // Security check - only allow whitelisted RSS feeds
  if (!ALLOWED_RSS_FEEDS.includes(feedUrl)) {
    return NextResponse.json(
      { error: 'RSS feed URL not allowed' },
      { status: 403 }
    );
  }

  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'HotNewsTrends RSS Reader/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`RSS feed fetch failed: ${response.status}`);
    }

    const rssData = await response.text();

    return new NextResponse(rssData, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('RSS proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RSS feed' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
