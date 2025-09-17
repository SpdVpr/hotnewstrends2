'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface QualityScore {
  content: number;
  seo: number;
  relevance: number;
  uniqueness: number;
  overall: number;
}

interface ArticleGenerationJob {
  id: string;
  trendId: string;
  trend: {
    title: string;
    category: string;
    formattedTraffic: string;
    source?: string;
  };
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'quality_check' | 'rejected';
  createdAt: string;
  completedAt?: string;
  error?: string;
  articleId?: string;
  template?: string;
  qualityScore?: QualityScore;
  retryCount?: number;
}

interface GenerationStats {
  totalJobs: number;
  pendingJobs: number;
  generatingJobs: number;
  completedJobs: number;
  failedJobs: number;
  rejectedJobs: number;
  todayJobs: number;
  isRunning: boolean;
  lastRun?: string;
  nextRun?: string;
  averageQualityScore?: number;
  successRate?: number;
}

export default function ArticleQualityPanel() {
  const [stats, setStats] = useState<GenerationStats | null>(null);
  const [jobs, setJobs] = useState<ArticleGenerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/automation/stats');
      const result = await response.json();

      if (result.success) {
        setStats(result.data.stats);
        setJobs(result.data.recentJobs || []);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching quality data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerationAction = async (action: 'start' | 'stop') => {
    try {
      setActionLoading(action);
      const response = await fetch('/api/trend-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: action === 'start' ? 'start_generation' : 'stop_generation' })
      });

      const data = await response.json();
      if (data.success) {
        // Refresh stats immediately
        await fetchData();
      } else {
        setError(data.error || `Failed to ${action} generation`);
      }
    } catch (err) {
      setError(`Network error during ${action}`);
      console.error(`Error ${action}ing generation:`, err);
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
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      generating: { color: 'bg-blue-100 text-blue-800', text: 'Generating' },
      quality_check: { color: 'bg-purple-100 text-purple-800', text: 'Quality Check' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed' },
      failed: { color: 'bg-red-100 text-red-800', text: 'Failed' },
      rejected: { color: 'bg-orange-100 text-orange-800', text: 'Rejected' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const getQualityBadge = (score?: number) => {
    if (!score) return null;
    
    if (score >= 85) {
      return <Badge className="bg-green-100 text-green-800">Excellent ({score})</Badge>;
    } else if (score >= 75) {
      return <Badge className="bg-blue-100 text-blue-800">Good ({score})</Badge>;
    } else if (score >= 60) {
      return <Badge className="bg-yellow-100 text-yellow-800">Fair ({score})</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Poor ({score})</Badge>;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-text-secondary">Loading quality data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quality Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.successRate ? `${Math.round(stats.successRate)}%` : 'N/A'}
            </div>
            <p className="text-xs text-text-secondary">
              Completed vs Total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.averageQualityScore ? `${Math.round(stats.averageQualityScore)}/100` : 'N/A'}
            </div>
            <p className="text-xs text-text-secondary">
              Overall Score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.todayJobs || 0}/20
            </div>
            <p className="text-xs text-text-secondary">
              Daily Limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.isRunning ? '🟢' : '🔴'}
            </div>
            <p className="text-xs text-text-secondary">
              {stats?.isRunning ? 'Running' : 'Stopped'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Generation Control */}
      <Card>
        <CardHeader>
          <CardTitle>🎛️ Article Generation Control</CardTitle>
          <CardDescription>
            Start or stop automated article generation from Firebase trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">
                Generation Status: {stats?.isRunning ? (
                  <span className="text-green-600">🟢 Active</span>
                ) : (
                  <span className="text-red-600">🔴 Stopped</span>
                )}
              </div>
              <div className="text-xs text-text-secondary">
                {stats?.isRunning
                  ? 'Automatically generating articles from Firebase trends every 15 minutes'
                  : 'Article generation is stopped - no new articles will be created'
                }
              </div>
            </div>
            <div className="flex gap-2">
              {!stats?.isRunning ? (
                <Button
                  onClick={() => handleGenerationAction('start')}
                  disabled={actionLoading === 'start'}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {actionLoading === 'start' ? 'Starting...' : '▶️ Start Generation'}
                </Button>
              ) : (
                <Button
                  onClick={() => handleGenerationAction('stop')}
                  disabled={actionLoading === 'stop'}
                  variant="destructive"
                >
                  {actionLoading === 'stop' ? 'Stopping...' : '⏹️ Stop Generation'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Generation Statistics</CardTitle>
          <CardDescription>Breakdown of article generation jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">{stats?.pendingJobs || 0}</div>
              <div className="text-xs text-text-secondary">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">{stats?.generatingJobs || 0}</div>
              <div className="text-xs text-text-secondary">Generating</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{stats?.completedJobs || 0}</div>
              <div className="text-xs text-text-secondary">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">{stats?.failedJobs || 0}</div>
              <div className="text-xs text-text-secondary">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600">{stats?.rejectedJobs || 0}</div>
              <div className="text-xs text-text-secondary">Rejected</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{stats?.totalJobs || 0}</div>
              <div className="text-xs text-text-secondary">Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Recent Generation Jobs</CardTitle>
          <CardDescription>Latest article generation attempts with quality scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs.length === 0 ? (
              <p className="text-center text-text-secondary py-8">No generation jobs found</p>
            ) : (
              jobs.slice(0, 10).map((job) => (
                <div key={job.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{job.trend.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {job.trend.category}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {job.trend.formattedTraffic}
                        </Badge>
                        {job.template && (
                          <Badge variant="secondary" className="text-xs">
                            {job.template}
                          </Badge>
                        )}
                        {job.trend.source && (
                          <Badge variant="secondary" className="text-xs">
                            {job.trend.source}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(job.status)}
                      {getQualityBadge(job.qualityScore?.overall)}
                    </div>
                  </div>
                  
                  <div className="text-xs text-text-secondary">
                    Created: {formatTime(job.createdAt)}
                    {job.completedAt && (
                      <span> • Completed: {formatTime(job.completedAt)}</span>
                    )}
                    {job.retryCount && job.retryCount > 0 && (
                      <span> • Retries: {job.retryCount}</span>
                    )}
                  </div>

                  {job.error && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      Error: {job.error}
                    </div>
                  )}

                  {job.qualityScore && (
                    <div className="text-xs space-y-1">
                      <div className="grid grid-cols-4 gap-2">
                        <div>Content: {job.qualityScore.content}/100</div>
                        <div>SEO: {job.qualityScore.seo}/100</div>
                        <div>Relevance: {job.qualityScore.relevance}/100</div>
                        <div>Uniqueness: {job.qualityScore.uniqueness}/100</div>
                      </div>
                    </div>
                  )}

                  {job.articleId && (
                    <div className="text-xs">
                      <a 
                        href={`/article/${job.articleId}`} 
                        target="_blank" 
                        className="text-blue-600 hover:underline"
                      >
                        View Article →
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
