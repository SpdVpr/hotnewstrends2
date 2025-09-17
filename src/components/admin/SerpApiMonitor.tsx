'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Alert, AlertDescription } from '@/components/ui/Alert';
// Using emoji icons instead of lucide-react for simplicity

interface SerpApiUsage {
  date: string;
  count: number;
  limit: number;
  isWeekend: boolean;
}

interface SerpApiStats {
  today: SerpApiUsage;
  thisMonth: {
    totalUsed: number;
    totalLimit: number;
    remainingDays: number;
    averagePerDay: number;
    recommendedDailyLimit: number;
  };
  status: 'safe' | 'warning' | 'critical';
}

interface SerpApiData {
  stats: SerpApiStats;
  report: string;
  canMakeCall: boolean;
  recommendations: string[];
}

export default function SerpApiMonitor() {
  const [data, setData] = useState<SerpApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/serpapi-usage');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch usage data');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching SerpApi usage:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchUsageData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <span>✅</span>;
      case 'warning': return <span>⚠️</span>;
      case 'critical': return <span>🚨</span>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 SerpApi Usage Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <span className="text-2xl animate-spin">🔄</span>
            <span className="ml-2">Loading usage data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 SerpApi Usage Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>⚠️ {error}</AlertDescription>
          </Alert>
          <Button onClick={fetchUsageData} className="mt-4">
            🔄 Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { stats, canMakeCall, recommendations } = data;
  const monthlyPercentage = (stats.thisMonth.totalUsed / stats.thisMonth.totalLimit) * 100;
  const dailyPercentage = (stats.today.count / stats.today.limit) * 100;

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 SerpApi Usage Monitor
            <Badge
              variant="secondary"
              className={`${getStatusColor(stats.status)} text-white`}
            >
              {getStatusIcon(stats.status)}
              <span className="ml-1">{stats.status.toUpperCase()}</span>
            </Badge>
          </CardTitle>
          <CardDescription>
            Monitor SerpApi usage to stay within 250 searches/month limit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Today's Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  📅 Today ({stats.today.date})
                </h3>
                <Badge variant={stats.today.isWeekend ? "secondary" : "primary"}>
                  {stats.today.isWeekend ? 'Weekend' : 'Weekday'}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Used: {stats.today.count}/{stats.today.limit} calls</span>
                  <span>{Math.round(dailyPercentage)}%</span>
                </div>
                <Progress value={dailyPercentage} className="h-2" />
              </div>
              <div className="flex items-center gap-2 text-sm">
                {canMakeCall ? (
                  <>
                    <span>✅</span>
                    <span className="text-green-600">Can make API calls</span>
                  </>
                ) : (
                  <>
                    <span>❌</span>
                    <span className="text-red-600">Daily limit reached</span>
                  </>
                )}
              </div>
            </div>

            {/* Monthly Usage */}
            <div className="space-y-3">
              <h3 className="font-medium">This Month</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Used: {stats.thisMonth.totalUsed}/{stats.thisMonth.totalLimit} calls</span>
                  <span>{Math.round(monthlyPercentage)}%</span>
                </div>
                <Progress value={monthlyPercentage} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Average/day:</span>
                  <div className="font-medium">{stats.thisMonth.averagePerDay}</div>
                </div>
                <div>
                  <span className="text-gray-500">Remaining days:</span>
                  <div className="font-medium">{stats.thisMonth.remainingDays}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <Alert key={index} variant={rec.includes('🚨') ? 'destructive' : rec.includes('⚠️') ? 'default' : 'default'}>
                  <AlertDescription>{rec}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={fetchUsageData} variant="secondary">
              🔄 Refresh Data
            </Button>
            <Button 
              onClick={() => window.open('https://serpapi.com/pricing', '_blank')} 
              variant="secondary"
            >
              Upgrade Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
