'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface TrackedTrend {
  id: string;
  title: string;
  category: string;
  formattedTraffic: string;
  source: string;
  firstSeen: string;
  articleGenerated: boolean;
  articleId?: string;
}

interface GenerationJob {
  id: string;
  trendId: string;
  trend: TrackedTrend;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  createdAt: string;
  error?: string;
  articleId?: string;
}

interface TrendTrackingData {
  summary: {
    totalTrends: number;
    articlesGenerated: number;
    pendingArticles: number;
    isGenerating: boolean;
    todayJobs: number;
    maxDailyJobs: number;
  };
  recentTrends: TrackedTrend[];
  recentJobs: GenerationJob[];
}

export default function TrendTrackingPanel() {
  const [data, setData] = useState<TrendTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trend-tracking');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching trend tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    try {
      setActionLoading(action);
      const response = await fetch('/api/trend-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      const result = await response.json();
      if (result.success) {
        await fetchData(); // Refresh data
      }
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'generating': return 'warning';
      case 'failed': return 'danger';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text">🤖 Trend Tracking & Auto-Generation</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-text-secondary mt-2">Loading trend tracking data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text">🤖 Trend Tracking & Auto-Generation</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-text-secondary">Failed to load trend tracking data</p>
          <Button onClick={fetchData} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text">🤖 Trend Tracking & Auto-Generation</h2>
        <Button onClick={fetchData} variant="secondary" size="sm">
          🔄 Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-lg">
          <div className="text-2xl font-bold text-primary">{data.summary.totalTrends}</div>
          <div className="text-sm text-text-secondary">Total Trends</div>
        </div>
        <div className="bg-surface p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{data.summary.articlesGenerated}</div>
          <div className="text-sm text-text-secondary">Articles Generated</div>
        </div>
        <div className="bg-surface p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{data.summary.pendingArticles}</div>
          <div className="text-sm text-text-secondary">Pending Articles</div>
        </div>
        <div className="bg-surface p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {data.summary.todayJobs}/{data.summary.maxDailyJobs}
          </div>
          <div className="text-sm text-text-secondary">Today's Jobs</div>
        </div>
      </div>

      {/* Generation Status */}
      <div className="bg-surface p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-text">Auto-Generation Status</h3>
          <Badge variant={data.summary.isGenerating ? 'success' : 'secondary'}>
            {data.summary.isGenerating ? '🟢 Running' : '🔴 Stopped'}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => handleAction('start_generation')}
            disabled={data.summary.isGenerating || actionLoading === 'start_generation'}
            variant="primary"
            size="sm"
          >
            {actionLoading === 'start_generation' ? 'Starting...' : '▶️ Start Generation'}
          </Button>
          <Button
            onClick={() => handleAction('stop_generation')}
            disabled={!data.summary.isGenerating || actionLoading === 'stop_generation'}
            variant="secondary"
            size="sm"
          >
            {actionLoading === 'stop_generation' ? 'Stopping...' : '⏹️ Stop Generation'}
          </Button>
          <Button
            onClick={() => handleAction('clear_trends')}
            disabled={actionLoading === 'clear_trends'}
            variant="secondary"
            size="sm"
          >
            {actionLoading === 'clear_trends' ? 'Clearing...' : '🗑️ Clear Trends'}
          </Button>
          <Button
            onClick={() => handleAction('clear_jobs')}
            disabled={actionLoading === 'clear_jobs'}
            variant="secondary"
            size="sm"
          >
            {actionLoading === 'clear_jobs' ? 'Clearing...' : '🗑️ Clear Jobs'}
          </Button>
        </div>
      </div>

      {/* Recent Trends */}
      <div className="bg-surface p-4 rounded-lg">
        <h3 className="font-medium text-text mb-4">📈 Recent Trends</h3>
        {data.recentTrends.length === 0 ? (
          <p className="text-text-secondary text-center py-4">No trends tracked yet</p>
        ) : (
          <div className="space-y-3">
            {data.recentTrends.slice(0, 5).map((trend) => (
              <div key={trend.id} className="flex items-center justify-between p-3 bg-background rounded">
                <div className="flex-1">
                  <div className="font-medium text-text">{trend.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{trend.formattedTraffic}</Badge>
                    <Badge variant="secondary">{trend.category}</Badge>
                    <Badge variant="secondary" className="text-xs">{trend.source}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={trend.articleGenerated ? 'success' : 'secondary'}>
                    {trend.articleGenerated ? '✅ Generated' : '⏳ Pending'}
                  </Badge>
                  <div className="text-xs text-text-secondary">
                    {formatDate(trend.firstSeen)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Jobs */}
      <div className="bg-surface p-4 rounded-lg">
        <h3 className="font-medium text-text mb-4">⚙️ Recent Generation Jobs</h3>
        {data.recentJobs.length === 0 ? (
          <p className="text-text-secondary text-center py-4">No generation jobs yet</p>
        ) : (
          <div className="space-y-3">
            {data.recentJobs.slice(0, 5).map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-background rounded">
                <div className="flex-1">
                  <div className="font-medium text-text">{job.trend.title}</div>
                  <div className="text-sm text-text-secondary mt-1">
                    {formatDate(job.createdAt)}
                  </div>
                  {job.error && (
                    <div className="text-sm text-red-600 mt-1">Error: {job.error}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadge(job.status)}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                  {job.articleId && (
                    <Badge variant="success" className="text-xs">
                      Article: {job.articleId.substring(0, 8)}...
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
