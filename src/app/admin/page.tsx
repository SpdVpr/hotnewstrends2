'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'articles' | 'settings' | 'serpapi' | 'tracking' | 'quality' | 'scheduler'>('overview');

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
            { key: 'overview', label: '📊 Overview', icon: '📊' },
            { key: 'trends', label: '📈 Google Trends', icon: '📈' },
            { key: 'scheduler', label: '⏰ Trends Scheduler', icon: '⏰' },
            { key: 'tracking', label: '🤖 Trend Tracking', icon: '🤖' },
            { key: 'quality', label: '🎯 Article Quality', icon: '🎯' },
            { key: 'articles', label: '📝 Articles', icon: '📝' },
            { key: 'serpapi', label: '🔍 SerpApi Monitor', icon: '🔍' },
            { key: 'settings', label: '⚙️ Settings', icon: '⚙️' }
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
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-text">{stats?.todayJobs || 0}</div>
                  <div className="text-sm text-text-secondary">Articles Today</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-text">{stats?.totalJobs || 0}</div>
                  <div className="text-sm text-text-secondary">Total Jobs</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-green-600">{stats?.completedJobs || 0}</div>
                  <div className="text-sm text-text-secondary">Completed</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-red-600">{stats?.failedJobs || 0}</div>
                  <div className="text-sm text-text-secondary">Failed</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Automation Control */}
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-text">Automation Control</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-text">Status:</span>
                    <Badge variant={stats?.isRunning ? 'success' : 'secondary'}>
                      {stats?.isRunning ? 'RUNNING' : 'STOPPED'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-text">Daily Limit:</span>
                    <span className="text-text-secondary">
                      {stats?.todayJobs || 0} / {stats?.config.maxArticlesPerDay || 0}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant={stats?.isRunning ? 'secondary' : 'primary'}
                      onClick={() => handleAutomationAction(stats?.isRunning ? 'stop' : 'start')}
                      disabled={actionLoading === 'start' || actionLoading === 'stop'}
                    >
                      {actionLoading === 'start' || actionLoading === 'stop' ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : null}
                      {stats?.isRunning ? 'Stop' : 'Start'} Automation
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Manual Generation */}
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-text">Generate Article</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">Topic</label>
                    <Input
                      value={manualTopic}
                      onChange={(e) => setManualTopic(e.target.value)}
                      placeholder="Enter trending topic..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-2">Category</label>
                    <select
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-light rounded-lg bg-white text-text"
                    >
                      <option value="Technology">Technology</option>
                      <option value="News">News</option>
                      <option value="Business">Business</option>
                      <option value="Science">Science</option>
                      <option value="Health">Health</option>
                    </select>
                  </div>

                  <Button
                    variant="primary"
                    onClick={handleManualGeneration}
                    disabled={!manualTopic.trim() || actionLoading === 'generate'}
                    className="w-full"
                  >
                    {actionLoading === 'generate' ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : null}
                    Generate Article
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Jobs */}
            <Card className="mt-8">
              <CardHeader>
                <h2 className="text-xl font-semibold text-text">Recent Jobs</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobs.length === 0 ? (
                    <p className="text-text-secondary text-center py-8">No jobs found</p>
                  ) : (
                    jobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-4 bg-surface rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-text">{job.topic}</h3>
                            {getStatusBadge(job.status)}
                            <Badge variant="secondary">{job.category}</Badge>
                          </div>

                          {job.article && (
                            <p className="text-sm text-text-secondary mb-2">{job.article.title}</p>
                          )}

                          {job.error && (
                            <p className="text-sm text-red-600">{job.error}</p>
                          )}

                          <p className="text-xs text-text-secondary">
                            Created: {new Date(job.createdAt).toLocaleString()}
                            {job.completedAt && (
                              <> • Completed: {new Date(job.completedAt).toLocaleString()}</>
                            )}
                          </p>
                        </div>

                        {job.article && (
                          <Button
                            variant="text"
                            size="sm"
                            onClick={() => window.open(`/article/${job.article!.slug}`, '_blank')}
                          >
                            View Article
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Google Trends Tab */}
        {activeTab === 'trends' && <GoogleTrendsPanel />}

        {/* Trends Scheduler Tab */}
        {activeTab === 'scheduler' && <TrendsSchedulerPanel />}

        {/* Trend Tracking Tab */}
        {activeTab === 'tracking' && <TrendTrackingPanel />}

        {/* Article Quality Tab */}
        {activeTab === 'quality' && <ArticleQualityPanel />}

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
