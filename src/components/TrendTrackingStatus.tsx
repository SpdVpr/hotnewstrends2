'use client';

import { useState, useEffect } from 'react';

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

export default function TrendTrackingStatus() {
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

  if (loading && !data) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-red-600">
          <h3 className="font-semibold mb-2">❌ Error Loading Trend Tracking</h3>
          <p className="text-sm">{error}</p>
          <button 
            onClick={fetchStatus}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'running': return 'text-blue-600 bg-blue-50';
      case 'next': return 'text-orange-600 bg-orange-50';
      case 'missed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'stale': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            📊 Trend Tracking Status
          </h2>
          <div className="text-sm text-gray-500">
            Last refresh: {lastRefresh?.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className={`p-4 border-b border-2 ${getSystemStatusColor(data.systemStatus.status)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{data.systemStatus.indicator}</span>
            <div>
              <h3 className="font-semibold">System Status: {data.systemStatus.status.toUpperCase()}</h3>
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
      <div className="p-4 bg-gray-50 border-b">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      {/* Last Update Info */}
      {data.lastUpdate && (
        <div className="p-4 bg-blue-50 border-b">
          <h4 className="font-medium text-gray-700 mb-2">📈 Last Update</h4>
          <div className="text-sm">
            <p><strong>Time:</strong> {new Date(data.lastUpdate.timestamp).toLocaleString()} ({data.lastUpdate.hoursAgo}h {data.lastUpdate.minutesAgo % 60}m ago)</p>
            <p><strong>Latest Trend:</strong> "{data.lastUpdate.trend.title}" ({data.lastUpdate.trend.searchVolume?.toLocaleString()} searches, {data.lastUpdate.trend.source})</p>
          </div>
        </div>
      )}

      {/* Schedule */}
      <div className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">📅 Daily Update Schedule (7 times)</h3>
        <div className="space-y-3">
          {data.schedule.map((item, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border ${getStatusColor(item.status)} ${item.isNext ? 'ring-2 ring-orange-300' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{item.indicator}</span>
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
                  <div className="font-medium">{item.statusText}</div>
                  {item.isNext && (
                    <div className="text-xs opacity-75">
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
      <div className="p-4 border-t bg-gray-50">
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '🔄 Refreshing...' : '🔄 Refresh Status'}
        </button>
      </div>
    </div>
  );
}
