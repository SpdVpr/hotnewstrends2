'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface PerformanceStats {
  timeframe: string;
  totalMetrics: number;
  stats: Record<string, {
    count: number;
    average: number;
    median: number;
    p75: number;
    p95: number;
    good: number;
    needsImprovement: number;
    poor: number;
  }>;
  recentMetrics: PerformanceMetric[];
  summary: {
    overallScore: number;
    coreWebVitalsScore: number;
    issues: string[];
    recommendations: string[];
  };
}

export const PerformanceMonitor: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('24h');

  useEffect(() => {
    fetchPerformanceStats();
    const interval = setInterval(fetchPerformanceStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [timeframe]);

  const fetchPerformanceStats = async () => {
    try {
      const response = await fetch(`/api/performance?timeframe=${timeframe}`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch performance stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'needs-improvement': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
          <h2 className="text-2xl font-bold text-gray-900">Performance Monitor</h2>
          <p className="text-gray-600">Real-time Core Web Vitals and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button variant="secondary" onClick={fetchPerformanceStats}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Overall Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(stats?.summary.overallScore || 0)}`}>
              {stats?.summary.overallScore.toFixed(1) || 0}%
            </div>
            <p className="text-sm text-gray-500 mt-1">Good metrics percentage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Core Web Vitals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(stats?.summary.coreWebVitalsScore || 0)}`}>
              {stats?.summary.coreWebVitalsScore.toFixed(1) || 0}%
            </div>
            <p className="text-sm text-gray-500 mt-1">CLS, FID, LCP scores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats?.totalMetrics || 0}
            </div>
            <p className="text-sm text-gray-500 mt-1">Collected in {timeframe}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals Breakdown</CardTitle>
          <CardDescription>Detailed performance metrics analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {stats?.stats && Object.entries(stats.stats).map(([metric, data]) => (
              <div key={metric} className="border-b pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{metric}</h3>
                  <div className="flex space-x-2">
                    <Badge className={getRatingColor('good')}>
                      {data.good} Good
                    </Badge>
                    <Badge className={getRatingColor('needs-improvement')}>
                      {data.needsImprovement} Needs Work
                    </Badge>
                    <Badge className={getRatingColor('poor')}>
                      {data.poor} Poor
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Average:</span>
                    <div className="font-medium">{data.average.toFixed(2)}ms</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Median:</span>
                    <div className="font-medium">{data.median.toFixed(2)}ms</div>
                  </div>
                  <div>
                    <span className="text-gray-500">75th %:</span>
                    <div className="font-medium">{data.p75.toFixed(2)}ms</div>
                  </div>
                  <div>
                    <span className="text-gray-500">95th %:</span>
                    <div className="font-medium">{data.p95.toFixed(2)}ms</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Count:</span>
                    <div className="font-medium">{data.count}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Issues and Recommendations */}
      {stats?.summary?.issues && stats.summary.issues.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Performance Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {stats.summary.issues.map((issue, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-red-500 mt-1">⚠️</span>
                    <span className="text-sm">{issue}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {stats.summary.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">💡</span>
                    <span className="text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Metrics</CardTitle>
          <CardDescription>Latest performance measurements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats?.recentMetrics.slice(0, 10).map((metric, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{metric.name}</span>
                  <Badge className={getRatingColor(metric.rating)}>
                    {metric.rating}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="font-medium">{metric.value.toFixed(2)}ms</div>
                  <div className="text-xs text-gray-500">
                    {new Date(metric.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
