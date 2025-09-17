'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/Loading';

interface TrendingTopic {
  title: string;
  formattedTraffic: string;
  searchVolume: number;
  category: string;
  source?: string;
  originalTitle?: string;
  relatedQueries?: string[];
}

interface GoogleTrendsData {
  topics: TrendingTopic[];
  lastUpdated: string;
  region: string;
  timeframe: string;
  total: number;
  source: string;
}

export function GoogleTrendsPanel() {
  const [trendsData, setTrendsData] = useState<GoogleTrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  useEffect(() => {
    fetchTrends();
    const interval = setInterval(fetchTrends, 180000); // Refresh every 3 minutes for fresher trends
    return () => clearInterval(interval);
  }, []);

  const fetchTrends = async () => {
    try {
      const response = await fetch('/api/trends?source=google');
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Trends API response:', data.data);
        console.log('🔍 First trend:', data.data?.topics?.[0]);
        setTrendsData(data.data);
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/trends?source=google&refresh=true');
      if (response.ok) {
        const data = await response.json();
        setTrendsData(data.data);
      }
    } catch (error) {
      console.error('Error refreshing trends:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const generateArticleFromTrend = async (topic: string) => {
    try {
      const response = await fetch('/api/automation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic,
          category: 'Technology'
        })
      });

      if (response.ok) {
        // Show success message or refresh data
        console.log('Article generation started for:', topic);
      }
    } catch (error) {
      console.error('Error generating article:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };



  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-text">Google Trends</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Parse search volume from formattedTraffic for sorting
  const parseSearchVolume = (formattedTraffic: string): number => {
    // Extract numbers from strings like "108,044 searches", "50,000+", etc.
    const match = formattedTraffic.match(/[\d,]+/);
    if (match) {
      return parseInt(match[0].replace(/,/g, ''), 10);
    }
    return 0;
  };

  // Sort trends by search volume (highest first)
  const currentTrends = (trendsData?.topics || [])
    .sort((a, b) => {
      const aVolume = a.searchVolume || parseSearchVolume(a.formattedTraffic);
      const bVolume = b.searchVolume || parseSearchVolume(b.formattedTraffic);
      console.log(`🔍 Sorting: "${a.title}" (${aVolume}) vs "${b.title}" (${bVolume})`);
      return bVolume - aVolume;
    });

  console.log('🔍 Current trends after sorting:', currentTrends.map(t => ({ title: t.title, volume: t.searchVolume || parseSearchVolume(t.formattedTraffic) })));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text">Google Trends</h2>
            {currentTrends && currentTrends.length > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {currentTrends.length} total
                </Badge>
                <Badge variant="primary" className="text-xs">
                  {currentTrends.filter(t => t.source?.includes('SerpApi')).length} SerpApi
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {currentTrends.filter(t => t.source?.includes('RSS')).length} RSS
                </Badge>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-text-secondary">
              Updated: {trendsData?.lastUpdated ? new Date(trendsData.lastUpdated).toLocaleTimeString() : 'Never'}
            </div>
            <Button
              variant="text"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? <LoadingSpinner size="sm" /> : '🔄'}
            </Button>
          </div>
        </div>

      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {!currentTrends || currentTrends.length === 0 ? (
            <p className="text-text-secondary text-center py-8">No trends available</p>
          ) : (
            currentTrends.slice(0, 20).map((trend, index) => (
              <div key={index} className="p-4 bg-surface rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-text mb-1">{trend.title}</h3>
                    {trend.originalTitle && trend.source === 'RSS' && (
                      <p className="text-sm text-text-secondary mb-1 italic">
                        Article: "{trend.originalTitle}"
                      </p>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{trend.formattedTraffic}</Badge>
                      {trend.searchVolume && (
                        <Badge variant="primary" className="text-xs">
                          {trend.searchVolume.toLocaleString()} searches
                        </Badge>
                      )}
                      <Badge variant="secondary">{trend.category}</Badge>
                      {trend.source && (
                        <Badge variant="secondary" className="text-xs">
                          {trend.source}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => generateArticleFromTrend(trend.title)}
                  >
                    Generate Article
                  </Button>
                </div>
                
                {/* Related Queries */}
                {trend.relatedQueries && trend.relatedQueries.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm text-text-secondary mb-1">Related queries:</div>
                    <div className="flex flex-wrap gap-1">
                      {trend.relatedQueries.slice(0, 5).map((query, qIndex) => (
                        <Badge key={qIndex} variant="secondary" className="text-xs">
                          {query}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Trend Details */}
                <div className="mb-3">
                  <div className="text-sm text-text-secondary mb-1">Trend details:</div>
                  <div className="text-xs text-text-secondary">
                    Traffic: {trend.formattedTraffic}
                    {trend.searchVolume && ` (${trend.searchVolume.toLocaleString()} searches)`}
                    • Category: {trend.category}
                    {trend.source && ` • Source: ${trend.source}`}
                  </div>
                </div>
                
                {/* Trend Actions */}
                <div className="text-xs text-text-secondary">
                  Click "Generate Article" to create content for this trending topic
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Source Info */}
        <div className="mt-4 pt-4 border-t border-gray-light">
          <div className="text-xs text-text-secondary">
            Source: {trendsData?.source || 'Google Trends API'} •
            Showing {trendsData?.total || 0} trending topics
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
