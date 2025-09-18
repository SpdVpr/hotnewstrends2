'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ScheduleItem {
  time: string;
  description: string;
  status: string;
  indicator: string;
  statusText: string;
  isPast: boolean;
  isCurrent: boolean;
  isNext: boolean;
  utcTime: string;
}

interface TrendTrackingData {
  currentTime: {
    utc: string;
    formatted: string;
    minutesSinceMidnight: number;
  };
  systemStatus: {
    status: string;
    indicator: string;
    message: string;
    recentUpdates: number;
    missedUpdates: number;
  };
  nextUpdate: {
    time: string;
    description: string;
    minutesUntil: number;
    hoursUntil: number;
    indicator: string;
  };
  lastUpdate: {
    timestamp: string;
    minutesAgo: number;
    hoursAgo: number;
    trend: {
      title: string;
      source: string;
      searchVolume: number;
    };
  } | null;
  schedule: ScheduleItem[];
  summary: {
    totalScheduled: number;
    completed: number;
    missed: number;
    pending: number;
  };
}

export default function TrendTrackingStatusPanel() {
  const [data, setData] = useState<TrendTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trends-tracking-status');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setError(null);
        setLastRefresh(new Date());
      } else {
        setError(result.error || 'Failed to fetch status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchStatus, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'next': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'missed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-orange-50 border-orange-200';
      case 'critical': return 'bg-red-50 border-red-200';
      case 'stale': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 Trend Tracking Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 Trend Tracking Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 space-y-3">
            <p>❌ Error: {error}</p>
            <Button onClick={fetchStatus} variant="outline" size="sm">
              🔄 Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>📊 Trend Tracking Status</CardTitle>
          <div className="text-sm text-gray-500">
            Last refresh: {lastRefresh?.toLocaleTimeString()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Status */}
        <div className={`p-4 rounded-lg border-2 ${getSystemStatusColor(data.systemStatus.status)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{data.systemStatus.indicator}</span>
              <div>
                <h3 className="font-semibold">System: {data.systemStatus.status.toUpperCase()}</h3>
                <p className="text-sm">{data.systemStatus.message}</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <div>✅ {data.summary.completed} completed</div>
              <div>❌ {data.summary.missed} missed</div>
              <div>⏳ {data.summary.pending} pending</div>
            </div>
          </div>
        </div>

        {/* Current Time & Next Update */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-700 mb-1">🕐 Current Time</h4>
            <p className="text-lg font-mono">{data.currentTime.formatted}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-1">⏰ Next Update</h4>
            <p className="text-lg font-mono">
              {data.nextUpdate.time} UTC 
              <span className="text-sm text-gray-600 ml-2">
                (in {data.nextUpdate.hoursUntil}h {data.nextUpdate.minutesUntil % 60}m)
              </span>
            </p>
          </div>
        </div>

        {/* Last Update Info */}
        {data.lastUpdate && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">📈 Last Update</h4>
            <div className="text-sm space-y-1">
              <p><strong>Time:</strong> {new Date(data.lastUpdate.timestamp).toLocaleString()} ({data.lastUpdate.hoursAgo}h {data.lastUpdate.minutesAgo % 60}m ago)</p>
              <p><strong>Latest Trend:</strong> "{data.lastUpdate.trend.title}" ({data.lastUpdate.trend.searchVolume?.toLocaleString()} searches, {data.lastUpdate.trend.source})</p>
            </div>
          </div>
        )}

        {/* Schedule */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">📅 Daily Update Schedule (7 times)</h3>
          <div className="space-y-2">
            {data.schedule.map((item, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${getStatusColor(item.status)} ${item.isNext ? 'ring-2 ring-orange-300' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{item.indicator}</span>
                    <div>
                      <div className="font-medium">
                        #{index + 1} - {item.utcTime}
                      </div>
                      <div className="text-sm opacity-75">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={getStatusColor(item.status)}>
                      {item.statusText}
                    </Badge>
                    {item.isNext && (
                      <div className="text-xs text-orange-600 mt-1">
                        Next update
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="pt-4 border-t">
          <Button
            onClick={fetchStatus}
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            {loading ? '🔄 Refreshing...' : '🔄 Refresh Status'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
