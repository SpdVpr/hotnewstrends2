import { NextResponse } from 'next/server';

// Mock data - in real app this would come from database/API
const mockArticles = [
  {
    id: '1',
    title: "AI Revolution Transforms Digital Marketing Landscape",
    excerpt: "Latest developments in artificial intelligence are reshaping how businesses approach digital marketing, with new tools emerging daily.",
    slug: "ai-revolution-transforms-digital-marketing-landscape",
    publishedAt: new Date('2025-01-15T10:30:00Z'),
    author: "Sarah Chen",
    category: "Technology",
  },
  {
    id: '2',
    title: "Climate Summit Reaches Historic Agreement",
    excerpt: "World leaders unite on groundbreaking climate initiatives that could reshape global environmental policy for decades.",
    slug: "climate-summit-reaches-historic-agreement",
    publishedAt: new Date('2025-01-15T08:15:00Z'),
    author: "Michael Rodriguez",
    category: "News",
  },
  {
    id: '3',
    title: "Breakthrough in Quantum Computing Announced",
    excerpt: "Scientists achieve new milestone in quantum computing that brings us closer to practical quantum applications.",
    slug: "breakthrough-in-quantum-computing-announced",
    publishedAt: new Date('2025-01-14T14:45:00Z'),
    author: "Dr. Emily Watson",
    category: "Science",
  },
];

function generateRSSFeed() {
  const baseUrl = 'https://hotnewstrends.com';
  const buildDate = new Date().toUTCString();
  
  const rssItems = mockArticles
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .map((article) => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <description><![CDATA[${article.excerpt}]]></description>
      <link>${baseUrl}/article/${article.slug}</link>
      <guid isPermaLink="true">${baseUrl}/article/${article.slug}</guid>
      <pubDate>${article.publishedAt.toUTCString()}</pubDate>
      <author>noreply@hotnewstrends.com (${article.author})</author>
      <category>${article.category}</category>
    </item>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>HotNewsTrends - Where Speed Meets Style</title>
    <description>AI-powered newsroom delivering comprehensive articles about trending topics within hours. Stay ahead with the fastest, most reliable source for trending news and analysis.</description>
    <link>${baseUrl}</link>
    <language>en-US</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <pubDate>${buildDate}</pubDate>
    <ttl>60</ttl>
    <managingEditor>noreply@hotnewstrends.com (HotNewsTrends Editorial Team)</managingEditor>
    <webMaster>noreply@hotnewstrends.com (HotNewsTrends Technical Team)</webMaster>
    <copyright>© ${new Date().getFullYear()} HotNewsTrends. All rights reserved.</copyright>
    <category>News</category>
    <category>Technology</category>
    <category>Business</category>
    <category>Science</category>
    <category>Health</category>
    <image>
      <url>${baseUrl}/logo.png</url>
      <title>HotNewsTrends</title>
      <link>${baseUrl}</link>
      <width>144</width>
      <height>144</height>
    </image>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`;
}

export async function GET() {
  const feed = generateRSSFeed();
  
  return new NextResponse(feed, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
