'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/Loading';
import { GoogleTrendsPanel } from '@/components/admin/GoogleTrendsPanel';
import { ArticlesManager } from '@/components/admin/ArticlesManager';
import { AutomationSettings } from '@/components/admin/AutomationSettings';
import TrendTrackingPanel from '@/components/admin/TrendTrackingPanel';
import SerpApiMonitor from '@/components/admin/SerpApiMonitor';
import ArticleQualityPanel from '@/components/admin/ArticleQualityPanel';
import TrendsSchedulerPanel from '@/components/admin/TrendsSchedulerPanel';

interface AutomationStats {
  totalJobs: number;
  todayJobs: number;
  completedJobs: number;
  failedJobs: number;
  pendingJobs: number;
  generatingJobs: number;
  isRunning: boolean;
  config: {
    enabled: boolean;
    interval: number;
    maxArticlesPerDay: number;
    minConfidenceScore: number;
    minGrowthRate: number;
  };
}

interface Job {
  id: string;
  topic: string;
  category: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  error?: string;
  article?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
  };
}

export default function AdminPage() {
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'articles' | 'settings' | 'serpapi'>('overview');

  // Manual generation form
  const [manualTopic, setManualTopic] = useState('');
  const [manualCategory, setManualCategory] = useState('Entertainment'); // Changed from Technology to Entertainment as default

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, jobsRes] = await Promise.all([
        fetch('/api/automation'),
        fetch('/api/automation/jobs?limit=20')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData.data.jobs);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutomationAction = async (action: 'start' | 'stop') => {
    setActionLoading(action);
    try {
      const response = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error(`Error ${action}ing automation:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualGeneration = async () => {
    if (!manualTopic.trim()) return;

    setActionLoading('generate');
    try {
      const response = await fetch('/api/automation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: manualTopic,
          category: manualCategory
        })
      });

      if (response.ok) {
        setManualTopic('');
        await fetchData();
      }
    } catch (error) {
      console.error('Error generating article:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      generating: 'primary',
      completed: 'success',
      failed: 'danger'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">Admin Dashboard</h1>
          <p className="text-text-secondary">Manage content automation and monitor article generation</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8">
          {[
            { key: 'overview', label: '📊 Control Panel', icon: '📊' },
            { key: 'trends', label: '📈 Trends', icon: '📈' },
            { key: 'articles', label: '📝 Articles', icon: '📝' },
            { key: 'settings', label: '⚙️ Settings', icon: '⚙️' },
            { key: 'serpapi', label: '🔍 SerpApi Monitor', icon: '🔍' }
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'primary' : 'text'}
              onClick={() => setActiveTab(tab.key as any)}
              className="flex items-center gap-2"
            >
              <span>{tab.icon}</span>
              {tab.label.replace(/^.+ /, '')}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Main Control Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Article Generation Control */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📝 Article Generation
                    <Badge variant={stats?.isRunning ? "primary" : "secondary"}>
                      {stats?.isRunning ? 'ON' : 'OFF'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Automatically generate articles from trending topics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => handleAutomationAction(stats?.isRunning ? 'stop' : 'start')}
                    disabled={actionLoading === 'start' || actionLoading === 'stop'}
                    variant={stats?.isRunning ? "secondary" : "primary"}
                    size="lg"
                    className="w-full"
                  >
                    {actionLoading === 'start' || actionLoading === 'stop' ? (
                      <LoadingSpinner size="sm" />
                    ) : stats?.isRunning ? (
                      '⏸️ Stop Article Generation'
                    ) : (
                      '▶️ Start Article Generation'
                    )}
                  </Button>

                  {/* Article Status */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Today's Articles:</span>
                      <span className="font-medium">{stats?.todayJobs || 0}/20</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Currently Generating:</span>
                      <span className="font-medium text-purple-600">{stats?.generatingJobs || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>In Queue:</span>
                      <span className="font-medium text-blue-600">{stats?.pendingJobs || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trend Tracking Control */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📈 Trend Tracking
                    <Badge variant="primary">ON</Badge>
                  </CardTitle>
                  <CardDescription>
                    Monitor and collect trending topics from various sources
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled
                  >
                    🔄 Trend Tracking Active
                  </Button>

                  {/* Trend Status */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Last Update:</span>
                      <span className="font-medium">2 hours ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Update:</span>
                      <span className="font-medium text-green-600">In 2 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trends Collected:</span>
                      <span className="font-medium">156 today</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Real-time Activity Monitoring */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🔄 Live Activity Monitor
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </CardTitle>
                <CardDescription>
                  Real-time status of article generation and trend tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Article Generation Activity */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-text flex items-center gap-2">
                      📝 Article Generation Activity
                    </h3>

                    {stats?.generatingJobs && stats.generatingJobs > 0 ? (
                      <div className="space-y-3">
                        {jobs.filter(job => job.status === 'generating').slice(0, 3).map((job) => (
                          <div key={job.id} className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{job.topic}</div>
                              <div className="text-xs text-text-secondary">
                                Started: {new Date(job.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">Generating</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-text-secondary">
                        {stats?.isRunning ? 'No articles currently generating' : 'Article generation is stopped'}
                      </div>
                    )}

                    {stats?.pendingJobs && stats.pendingJobs > 0 && (
                      <div className="mt-4">
                        <div className="text-sm font-medium text-text-secondary mb-2">Queue ({stats.pendingJobs} pending)</div>
                        <div className="space-y-2">
                          {jobs.filter(job => job.status === 'pending').slice(0, 2).map((job) => (
                            <div key={job.id} className="flex items-center gap-3 p-2 bg-blue-50 rounded">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <div className="text-sm">{job.topic}</div>
                              <Badge variant="secondary" className="text-xs">Queued</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Trend Tracking Activity */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-text flex items-center gap-2">
                      📈 Trend Tracking Activity
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">SerpAPI + RSS Monitoring</div>
                          <div className="text-xs text-text-secondary">Active • Next update in 1h 45m</div>
                        </div>
                        <Badge variant="primary" className="text-xs">Active</Badge>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">Last Collection</div>
                          <div className="text-xs text-text-secondary">156 trends • 2 hours ago</div>
                        </div>
                        <Badge variant="secondary" className="text-xs">Completed</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && <GoogleTrendsPanel />}

        {/* Articles Tab */}
        {activeTab === 'articles' && <ArticlesManager />}

        {/* Settings Tab */}
        {activeTab === 'settings' && <AutomationSettings />}

        {/* SerpApi Monitor Tab */}
        {activeTab === 'serpapi' && <SerpApiMonitor />}
      </main>
    </div>
  );
}
