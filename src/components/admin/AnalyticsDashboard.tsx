'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface AnalyticsData {
  overview: {
    totalPageviews: number;
    uniqueVisitors: number;
    bounceRate: number;
    avgSessionDuration: number;
    topPages: Array<{ path: string; views: number; title: string }>;
    topReferrers: Array<{ source: string; visits: number; percentage: number }>;
  };
  realtime: {
    activeUsers: number;
    currentPageviews: number;
    topActivePages: Array<{ path: string; users: number }>;
  };
  content: {
    topArticles: Array<{
      title: string;
      slug: string;
      views: number;
      avgTimeOnPage: number;
      bounceRate: number;
    }>;
    categoryPerformance: Array<{
      category: string;
      articles: number;
      totalViews: number;
      avgEngagement: number;
    }>;
  };
  audience: {
    demographics: {
      countries: Array<{ country: string; percentage: number; users: number }>;
      devices: Array<{ device: string; percentage: number; users: number }>;
      browsers: Array<{ browser: string; percentage: number; users: number }>;
    };
    behavior: {
      newVsReturning: { new: number; returning: number };
      sessionDuration: Array<{ range: string; percentage: number }>;
    };
  };
  conversion: {
    goals: Array<{
      name: string;
      completions: number;
      conversionRate: number;
      value: number;
    }>;
    events: Array<{
      event: string;
      count: number;
      uniqueUsers: number;
    }>;
  };
}

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalyticsData();
    const interval = setInterval(fetchAnalyticsData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      // Mock analytics data - in production, integrate with Google Analytics API
      const mockData: AnalyticsData = {
        overview: {
          totalPageviews: Math.floor(Math.random() * 50000) + 10000,
          uniqueVisitors: Math.floor(Math.random() * 15000) + 3000,
          bounceRate: Math.random() * 30 + 35, // 35-65%
          avgSessionDuration: Math.random() * 180 + 120, // 2-5 minutes
          topPages: [
            { path: '/', views: 8542, title: 'Homepage' },
            { path: '/article/ai-revolution-transforms-digital-marketing', views: 3241, title: 'AI Revolution in Marketing' },
            { path: '/article/climate-summit-reaches-historic-agreement', views: 2156, title: 'Climate Summit Agreement' },
            { path: '/category/technology', views: 1876, title: 'Technology Category' },
            { path: '/search', views: 1234, title: 'Search Results' }
          ],
          topReferrers: [
            { source: 'google.com', visits: 12543, percentage: 45.2 },
            { source: 'twitter.com', visits: 3421, percentage: 12.3 },
            { source: 'facebook.com', visits: 2876, percentage: 10.4 },
            { source: 'linkedin.com', visits: 1987, percentage: 7.2 },
            { source: 'direct', visits: 6890, percentage: 24.9 }
          ]
        },
        realtime: {
          activeUsers: Math.floor(Math.random() * 200) + 50,
          currentPageviews: Math.floor(Math.random() * 500) + 100,
          topActivePages: [
            { path: '/', users: 45 },
            { path: '/article/ai-revolution-transforms-digital-marketing', users: 23 },
            { path: '/category/technology', users: 18 },
            { path: '/search', users: 12 },
            { path: '/article/climate-summit-reaches-historic-agreement', users: 8 }
          ]
        },
        content: {
          topArticles: [
            {
              title: 'AI Revolution Transforms Digital Marketing',
              slug: 'ai-revolution-transforms-digital-marketing',
              views: 15420,
              avgTimeOnPage: 245,
              bounceRate: 32.1
            },
            {
              title: 'Climate Summit Reaches Historic Agreement',
              slug: 'climate-summit-reaches-historic-agreement',
              views: 12340,
              avgTimeOnPage: 198,
              bounceRate: 28.5
            },
            {
              title: 'Breakthrough in Quantum Computing',
              slug: 'breakthrough-in-quantum-computing-announced',
              views: 9876,
              avgTimeOnPage: 312,
              bounceRate: 25.3
            }
          ],
          categoryPerformance: [
            { category: 'Technology', articles: 8, totalViews: 45230, avgEngagement: 4.2 },
            { category: 'News', articles: 6, totalViews: 32100, avgEngagement: 3.8 },
            { category: 'Business', articles: 4, totalViews: 18750, avgEngagement: 3.5 },
            { category: 'Science', articles: 3, totalViews: 15420, avgEngagement: 4.1 }
          ]
        },
        audience: {
          demographics: {
            countries: [
              { country: 'United States', percentage: 42.3, users: 12690 },
              { country: 'United Kingdom', percentage: 18.7, users: 5610 },
              { country: 'Canada', percentage: 12.1, users: 3630 },
              { country: 'Germany', percentage: 8.9, users: 2670 },
              { country: 'Australia', percentage: 6.2, users: 1860 }
            ],
            devices: [
              { device: 'Desktop', percentage: 52.4, users: 15720 },
              { device: 'Mobile', percentage: 38.9, users: 11670 },
              { device: 'Tablet', percentage: 8.7, users: 2610 }
            ],
            browsers: [
              { browser: 'Chrome', percentage: 68.2, users: 20460 },
              { browser: 'Safari', percentage: 18.5, users: 5550 },
              { browser: 'Firefox', percentage: 8.1, users: 2430 },
              { browser: 'Edge', percentage: 5.2, users: 1560 }
            ]
          },
          behavior: {
            newVsReturning: { new: 67.3, returning: 32.7 },
            sessionDuration: [
              { range: '0-10s', percentage: 15.2 },
              { range: '11-30s', percentage: 22.8 },
              { range: '31-60s', percentage: 18.9 },
              { range: '1-3m', percentage: 25.4 },
              { range: '3m+', percentage: 17.7 }
            ]
          }
        },
        conversion: {
          goals: [
            { name: 'Article Share', completions: 1876, conversionRate: 8.3, value: 0 },
            { name: 'Category Follow', completions: 456, conversionRate: 1.9, value: 0 },
            { name: 'Search Usage', completions: 3421, conversionRate: 15.2, value: 0 }
          ],
          events: [
            { event: 'article_view', count: 45230, uniqueUsers: 18920 },
            { event: 'search', count: 8765, uniqueUsers: 4320 },
            { event: 'share', count: 2341, uniqueUsers: 1876 }
          ]
        }
      };

      setData(mockData);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Website traffic and user behavior insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <Button variant="secondary" onClick={fetchAnalyticsData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">
              {formatNumber(data?.overview.totalPageviews || 0)}
            </div>
            <div className="text-sm text-gray-500">Total Pageviews</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(data?.overview.uniqueVisitors || 0)}
            </div>
            <div className="text-sm text-gray-500">Unique Visitors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">
              {data?.overview.bounceRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Bounce Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-purple-600">
              {formatDuration(data?.overview.avgSessionDuration || 0)}
            </div>
            <div className="text-sm text-gray-500">Avg Session</div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Real-time Activity</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </CardTitle>
          <CardDescription>Current website activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold text-green-600">{data?.realtime.activeUsers}</div>
              <div className="text-sm text-gray-500">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">{data?.realtime.currentPageviews}</div>
              <div className="text-sm text-gray-500">Current Pageviews</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Top Active Pages</div>
              <div className="space-y-1">
                {data?.realtime.topActivePages.slice(0, 3).map((page, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="truncate">{page.path}</span>
                    <span className="font-medium">{page.users}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Content and Traffic Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited pages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.overview.topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {page.title}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{page.path}</div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatNumber(page.views)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Where visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.overview.topReferrers.map((referrer, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium text-gray-900">
                      {referrer.source}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {referrer.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatNumber(referrer.visits)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Content Performance</CardTitle>
          <CardDescription>Top performing articles and categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Top Articles</h3>
              <div className="space-y-3">
                {data?.content.topArticles.map((article, index) => (
                  <div key={index} className="border-l-4 border-blue-400 pl-3">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {article.title}
                    </div>
                    <div className="flex space-x-4 text-xs text-gray-500">
                      <span>{formatNumber(article.views)} views</span>
                      <span>{formatDuration(article.avgTimeOnPage)} avg time</span>
                      <span>{article.bounceRate.toFixed(1)}% bounce</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Category Performance</h3>
              <div className="space-y-3">
                {data?.content.categoryPerformance.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {category.category}
                      </div>
                      <div className="text-xs text-gray-500">
                        {category.articles} articles
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatNumber(category.totalViews)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {category.avgEngagement.toFixed(1)} engagement
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
