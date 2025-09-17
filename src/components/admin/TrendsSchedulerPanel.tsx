'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Clock, 
  TrendingUp, 
  FileText, 
  Database,
  Activity
} from 'lucide-react';

interface SchedulerData {
  scheduler: {
    isRunning: boolean;
    lastUpdate: string | null;
    nextUpdate: string | null;
    updatesPerDay: number;
    totalUpdates: number;
    trendsCollected: number;
    articlesGenerated: number;
    timeUntilNextUpdate: string;
  };
  trends: {
    total: number;
    needingArticles: number;
    articlesGenerated: number;
    latestBatchId: string | null;
  };
}

export default function TrendsSchedulerPanel() {
  const [schedulerData, setSchedulerData] = useState<SchedulerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch scheduler data
  const fetchSchedulerData = async () => {
    try {
      const response = await fetch('/api/trends/scheduler');
      if (response.ok) {
        const data = await response.json();
        setSchedulerData(data.data);
      }
    } catch (error) {
      console.error('Error fetching scheduler data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Control scheduler
  const controlScheduler = async (action: 'start' | 'stop' | 'force-update') => {
    setActionLoading(action);
    try {
      const response = await fetch('/api/trends/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(result.message);
        
        // Refresh data after action
        setTimeout(() => {
          fetchSchedulerData();
        }, 1000);
      }
    } catch (error) {
      console.error(`Error ${action}:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    fetchSchedulerData();
    const interval = setInterval(fetchSchedulerData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Trends Scheduler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-text-secondary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!schedulerData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Trends Scheduler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-text-secondary">Failed to load scheduler data</p>
        </CardContent>
      </Card>
    );
  }

  const { scheduler, trends } = schedulerData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Trends Scheduler
          <Badge variant={scheduler.isRunning ? "success" : "secondary"}>
            {scheduler.isRunning ? 'Running' : 'Stopped'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => controlScheduler(scheduler.isRunning ? 'stop' : 'start')}
            disabled={actionLoading === 'start' || actionLoading === 'stop'}
            variant={scheduler.isRunning ? "secondary" : "primary"}
            size="sm"
          >
            {actionLoading === 'start' || actionLoading === 'stop' ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : scheduler.isRunning ? (
              <Pause className="h-4 w-4 mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {scheduler.isRunning ? 'Stop' : 'Start'} Scheduler
          </Button>
          
          <Button
            onClick={() => controlScheduler('force-update')}
            disabled={actionLoading === 'force-update'}
            variant="secondary"
            size="sm"
          >
            {actionLoading === 'force-update' ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Force Update
          </Button>
        </div>

        {/* Smart Scheduling Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Smart Scheduling Active</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-blue-600">Active Hours:</span>
              <div className="font-medium text-blue-800">{scheduler.activeHours || '6:00-22:00'}</div>
            </div>
            <div>
              <span className="text-blue-600">Today's Progress:</span>
              <div className="font-medium text-blue-800">
                {scheduler.dailyUpdateCount || 0}/{scheduler.updatesPerDay} updates
              </div>
            </div>
            <div>
              <span className="text-blue-600">Remaining:</span>
              <div className="font-medium text-blue-800">
                {scheduler.remainingUpdates || 0} updates left
              </div>
            </div>
          </div>
        </div>

        {/* Article Generation Status */}
        {console.log('🔍 Article Generation Data:', scheduler.articleGeneration)}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Article Generation Status</span>
          </div>

          {scheduler.articleGeneration ? (
            <>
              {/* Debug info */}
              <div className="mb-2 p-2 bg-gray-100 rounded text-xs">
                <strong>Debug:</strong> {JSON.stringify(scheduler.articleGeneration, null, 2)}
              </div>

            {scheduler.articleGeneration.currentlyGenerating ? (
              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Currently Generating</span>
                </div>
                <div className="text-sm text-yellow-700">
                  <div className="font-medium">"{scheduler.articleGeneration.currentlyGenerating.trend.keyword}"</div>
                  <div className="text-xs mt-1">
                    Started: {new Date(scheduler.articleGeneration.currentlyGenerating.startedAt).toLocaleTimeString()}
                    {' • '}
                    Est. completion: {new Date(scheduler.articleGeneration.currentlyGenerating.estimatedCompletion).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded">
                <div className="text-sm text-gray-600">No article currently being generated</div>
              </div>
            )}

            {scheduler.articleGeneration.queuedArticles.length > 0 && (
              <div className="mb-3">
                <div className="text-sm font-medium text-green-800 mb-2">
                  Queued Articles ({scheduler.articleGeneration.queuedArticles.length})
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {scheduler.articleGeneration.queuedArticles.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          #{item.position}: "{item.trend.keyword}"
                        </div>
                        <div className="text-xs text-gray-500">
                          Volume: {item.trend.searchVolume?.toLocaleString() || 'N/A'}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(item.scheduledFor).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800">Batch Progress</span>
                <span className="text-sm text-green-600">
                  {scheduler.articleGeneration.completedInBatch}/{scheduler.articleGeneration.totalInBatch} completed
                </span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2 mb-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(scheduler.articleGeneration.completedInBatch / scheduler.articleGeneration.totalInBatch) * 100}%`
                  }}
                ></div>
              </div>

              {/* Show completion status */}
              {scheduler.articleGeneration.completedInBatch >= scheduler.articleGeneration.totalInBatch ? (
                <div className="text-xs text-green-700 font-medium">
                  ✅ Batch completed! All {scheduler.articleGeneration.totalInBatch} articles generated.
                </div>
              ) : (
                <div className="text-xs text-green-600">
                  🔄 {scheduler.articleGeneration.totalInBatch - scheduler.articleGeneration.completedInBatch} articles remaining
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-green-600">Remaining:</span>
                <div className="font-medium text-green-800">
                  {scheduler.articleGeneration.totalInBatch - scheduler.articleGeneration.completedInBatch}
                </div>
              </div>
              <div>
                <span className="text-green-600">Batch Started:</span>
                <div className="font-medium text-green-800">
                  {scheduler.articleGeneration.batchStartedAt
                    ? new Date(scheduler.articleGeneration.batchStartedAt).toLocaleTimeString()
                    : 'N/A'
                  }
                </div>
              </div>
            </div>
            </>
          ) : (
            <div className="text-sm text-gray-600">
              No article generation data available. Scheduler may not be running or no articles are queued.
            </div>
          )}
        </div>

        {/* Scheduler Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-text-secondary" />
              <span className="text-sm text-text-secondary">Updates/Day</span>
            </div>
            <div className="text-lg font-semibold text-text">
              {scheduler.updatesPerDay}x
            </div>
          </div>

          <div className="bg-surface p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-text-secondary" />
              <span className="text-sm text-text-secondary">Total Updates</span>
            </div>
            <div className="text-lg font-semibold text-text">
              {scheduler.totalUpdates}
            </div>
          </div>

          <div className="bg-surface p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Database className="h-4 w-4 text-text-secondary" />
              <span className="text-sm text-text-secondary">Trends Collected</span>
            </div>
            <div className="text-lg font-semibold text-text">
              {scheduler.trendsCollected}
            </div>
          </div>

          <div className="bg-surface p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-text-secondary" />
              <span className="text-sm text-text-secondary">Articles Generated</span>
            </div>
            <div className="text-lg font-semibold text-text">
              {scheduler.articlesGenerated}
            </div>
          </div>
        </div>

        {/* Timing Info */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Last Update:</span>
            <span className="text-sm text-text">
              {scheduler.lastUpdate 
                ? new Date(scheduler.lastUpdate).toLocaleString()
                : 'Never'
              }
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Next Update:</span>
            <span className="text-sm text-text">
              {scheduler.isRunning 
                ? `In ${scheduler.timeUntilNextUpdate}`
                : 'Not scheduled'
              }
            </span>
          </div>
        </div>

        {/* Firebase Trends Stats */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-text mb-3">Firebase Trends Database</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-surface p-3 rounded-lg">
              <div className="text-sm text-text-secondary mb-1">Total Trends</div>
              <div className="text-lg font-semibold text-text">{trends.total}</div>
            </div>

            <div className="bg-surface p-3 rounded-lg">
              <div className="text-sm text-text-secondary mb-1">Need Articles</div>
              <div className="text-lg font-semibold text-text">{trends.needingArticles}</div>
            </div>

            <div className="bg-surface p-3 rounded-lg">
              <div className="text-sm text-text-secondary mb-1">Articles Done</div>
              <div className="text-lg font-semibold text-text">{trends.articlesGenerated}</div>
            </div>
          </div>

          {trends.latestBatchId && (
            <div className="mt-3">
              <div className="text-sm text-text-secondary">Latest Batch ID:</div>
              <div className="text-xs font-mono text-text bg-surface px-2 py-1 rounded mt-1">
                {trends.latestBatchId}
              </div>
            </div>
          )}
        </div>

        {/* Status Description */}
        <div className="bg-surface p-3 rounded-lg">
          <div className="text-sm text-text-secondary mb-2">System Status:</div>
          <div className="text-sm text-text">
            {scheduler.isRunning ? (
              <>
                ✅ Scheduler is running - automatically fetching trends 6x daily and generating articles from Firebase trends.
              </>
            ) : (
              <>
                ⏸️ Scheduler is stopped - no automatic trend updates or article generation.
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
