'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

interface DailyPlan {
  date: string;
  jobs: DailyPlanJob[];
  createdAt: string;
  updatedAt: string;
}

interface DailyPlanJob {
  id: string;
  trendId: string;
  trend: {
    title: string;
    formattedTraffic: string;
    traffic: number;
    category: string;
  };
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'quality_check' | 'rejected';
  position: number;
  scheduledAt?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  articleId?: string;
  error?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'articles' | 'settings' | 'serpapi'>('overview');
  const [nextUpdateCountdown, setNextUpdateCountdown] = useState<string>('Calculating...');

  // Manual generation form
  const [manualTopic, setManualTopic] = useState('');
  const [manualCategory, setManualCategory] = useState('Entertainment'); // Changed from Technology to Entertainment as default

  // Function to calculate next update countdown
  const calculateNextUpdateCountdown = () => {
    const now = new Date();
    const currentHour = now.getHours();

    // Trends scheduler runs 6x daily: 6:00, 10:40, 13:20, 16:00, 18:40, 21:20
    const scheduleTimes = [6, 10.67, 13.33, 16, 18.67, 21.33]; // Convert minutes to decimal hours
    const currentTime = currentHour + now.getMinutes() / 60;

    // Find next scheduled time
    let nextTime = scheduleTimes.find(time => time > currentTime);
    if (!nextTime) {
      // If no more times today, next is 6:00 tomorrow
      nextTime = 6 + 24;
    }

    const hoursUntilNext = nextTime - currentTime;
    const hours = Math.floor(hoursUntilNext);
    const minutes = Math.round((hoursUntilNext - hours) * 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Update countdown every minute
  useEffect(() => {
    const updateCountdown = () => {
      setNextUpdateCountdown(calculateNextUpdateCountdown());
    };

    updateCountdown(); // Initial calculation
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, jobsRes, schedulerRes, dailyPlanRes] = await Promise.all([
        fetch('/api/automation'),
        fetch('/api/automation/jobs?limit=20'),
        fetch('/api/trends/scheduler'),
        fetch('/api/daily-plan')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData.data.jobs);
      }

      if (schedulerRes.ok) {
        const schedulerData = await schedulerRes.json();
        console.log('📊 Trends Scheduler Status:', schedulerData.data?.scheduler);
      }

      if (dailyPlanRes.ok) {
        const dailyPlanData = await dailyPlanRes.json();
        setDailyPlan(dailyPlanData.data.dailyPlan);
        console.log('📅 Daily Plan:', dailyPlanData.data.dailyPlan);
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

  const handleForceStop = async () => {
    setActionLoading('force-stop');
    try {
      const response = await fetch('/api/debug/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        await fetchData(); // Refresh data
        console.log('🛑 FORCE STOP executed successfully');
      }
    } catch (error) {
      console.error('Error with force stop:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleForceUpdateTrends = async () => {
    setActionLoading('force-trends');
    try {
      // First start the trends scheduler
      await fetch('/api/trends/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });

      // Then force update
      const response = await fetch('/api/trends/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force-update' })
      });

      if (response.ok) {
        console.log('✅ Trends force update initiated');
        await fetchData();
      }
    } catch (error) {
      console.error('Error forcing trends update:', error);
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

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/login', {
        method: 'DELETE',
      });

      // Clear client-side cookie
      document.cookie = 'admin-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

      // Redirect to login
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if API call fails
      router.push('/admin/login');
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
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">Admin Dashboard</h1>
            <p className="text-text-secondary">Manage content automation and monitor article generation</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            🔐 Logout
          </Button>
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
                  <div className="space-y-2">
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

                    <Button
                      onClick={handleForceStop}
                      disabled={actionLoading === 'force-stop'}
                      variant="destructive"
                      size="sm"
                      className="w-full"
                    >
                      {actionLoading === 'force-stop' ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        '🛑 FORCE STOP ALL'
                      )}
                    </Button>
                  </div>

                  {/* Article Status */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Today's Articles:</span>
                      <span className="font-medium">{stats?.todayJobs || 0}/24</span>
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

                  {/* Daily Plan Timeline */}
                  {dailyPlan && dailyPlan.jobs && dailyPlan.jobs.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          📅 Daily Plan (24 Articles)
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        </h4>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-2 py-1 h-6"
                            onClick={async () => {
                              try {
                                const response = await fetch('/api/daily-plan', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ action: 'reset-failed' })
                                });
                                if (response.ok) {
                                  fetchData();
                                }
                              } catch (error) {
                                console.error('Reset failed:', error);
                              }
                            }}
                          >
                            🔄 Reset
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs px-2 py-1 h-6"
                            onClick={async () => {
                              try {
                                const response = await fetch('/api/daily-plan', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ action: 'test-mode' })
                                });
                                if (response.ok) {
                                  fetchData();
                                }
                              } catch (error) {
                                console.error('Test mode failed:', error);
                              }
                            }}
                          >
                            🧪 Test (5min)
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {dailyPlan.jobs.map((job) => (
                          <div key={job.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                job.status === 'completed' ? 'bg-green-500' :
                                job.status === 'generating' ? 'bg-purple-500 animate-pulse' :
                                job.status === 'failed' ? 'bg-red-500' :
                                job.status === 'rejected' ? 'bg-orange-500' :
                                'bg-gray-400'
                              }`}></span>
                              <span className="font-medium">#{job.position}</span>
                              <span className="truncate max-w-[120px]">"{job.trend.title}"</span>
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                {job.trend.formattedTraffic}
                              </Badge>
                            </div>
                            <div className="text-right">
                              {job.status === 'completed' ? (
                                <span className="text-green-600">✅ Done</span>
                              ) : job.status === 'generating' ? (
                                <span className="text-purple-600">🔄 Generating...</span>
                              ) : job.status === 'failed' ? (
                                <span className="text-red-600">❌ Failed</span>
                              ) : job.status === 'rejected' ? (
                                <span className="text-orange-600">⚠️ Rejected</span>
                              ) : job.scheduledAt ? (
                                <span className="text-gray-600">
                                  {new Date(job.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              ) : (
                                <span className="text-gray-600">Pending</span>
                              )}
                            </div>
                          </div>
                        ))}

                      </div>
                    </div>
                  )}
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
                    onClick={handleForceUpdateTrends}
                    disabled={actionLoading === 'force-trends'}
                    variant="primary"
                    size="lg"
                    className="w-full"
                  >
                    {actionLoading === 'force-trends' ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      '🔄 Force Update Trends Now'
                    )}
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
                          <div className="text-xs text-text-secondary">Active • Next update in {nextUpdateCountdown}</div>
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
