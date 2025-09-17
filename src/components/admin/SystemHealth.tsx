'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface SystemMetrics {
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    requests: number;
    errors: number;
    avgResponseTime: number;
  };
  cache: {
    hitRate: number;
    size: number;
    maxSize: number;
  };
  database: {
    connections: number;
    maxConnections: number;
    avgQueryTime: number;
  };
}

interface HealthCheck {
  service: string;
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  lastCheck: string;
  responseTime?: number;
}

export const SystemHealth: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      // Mock system metrics - in production, implement actual system monitoring
      const mockMetrics: SystemMetrics = {
        uptime: Date.now() - (Math.random() * 86400000), // Random uptime up to 24h
        memory: {
          used: 2.4,
          total: 8.0,
          percentage: 30
        },
        cpu: {
          usage: Math.random() * 50 + 10, // 10-60% usage
          cores: 4
        },
        disk: {
          used: 45.2,
          total: 100.0,
          percentage: 45.2
        },
        network: {
          requests: Math.floor(Math.random() * 1000) + 500,
          errors: Math.floor(Math.random() * 10),
          avgResponseTime: Math.random() * 200 + 50
        },
        cache: {
          hitRate: Math.random() * 20 + 80, // 80-100% hit rate
          size: Math.random() * 500 + 100,
          maxSize: 1000
        },
        database: {
          connections: Math.floor(Math.random() * 20) + 5,
          maxConnections: 100,
          avgQueryTime: Math.random() * 50 + 10
        }
      };

      const mockHealthChecks: HealthCheck[] = [
        {
          service: 'API Server',
          status: 'healthy',
          message: 'All endpoints responding normally',
          lastCheck: new Date().toISOString(),
          responseTime: 45
        },
        {
          service: 'Database',
          status: 'healthy',
          message: 'Connection pool healthy',
          lastCheck: new Date().toISOString(),
          responseTime: 12
        },
        {
          service: 'Cache (Redis)',
          status: Math.random() > 0.8 ? 'warning' : 'healthy',
          message: Math.random() > 0.8 ? 'High memory usage detected' : 'Operating normally',
          lastCheck: new Date().toISOString(),
          responseTime: 3
        },
        {
          service: 'External APIs',
          status: Math.random() > 0.9 ? 'critical' : 'healthy',
          message: Math.random() > 0.9 ? 'Perplexity API rate limit reached' : 'All APIs responding',
          lastCheck: new Date().toISOString(),
          responseTime: 150
        },
        {
          service: 'File Storage',
          status: 'healthy',
          message: 'Storage accessible and responsive',
          lastCheck: new Date().toISOString(),
          responseTime: 25
        }
      ];

      setMetrics(mockMetrics);
      setHealthChecks(mockHealthChecks);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor((Date.now() - uptime) / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
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
          <h2 className="text-2xl font-bold text-gray-900">System Health</h2>
          <p className="text-gray-600">Real-time system metrics and health monitoring</p>
        </div>
        <Button variant="secondary" onClick={fetchSystemHealth}>
          Refresh
        </Button>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics ? formatUptime(metrics.uptime) : '0m'}
            </div>
            <p className="text-sm text-gray-500 mt-1">System running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {metrics?.memory.percentage.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${getUsageColor(metrics?.memory.percentage || 0)}`}
                style={{ width: `${metrics?.memory.percentage || 0}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {metrics?.memory.used.toFixed(1)}GB / {metrics?.memory.total.toFixed(1)}GB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">CPU Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {metrics?.cpu.usage.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${getUsageColor(metrics?.cpu.usage || 0)}`}
                style={{ width: `${metrics?.cpu.usage || 0}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-1">{metrics?.cpu.cores} cores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Disk Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {metrics?.disk.percentage.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${getUsageColor(metrics?.disk.percentage || 0)}`}
                style={{ width: `${metrics?.disk.percentage || 0}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {metrics?.disk.used.toFixed(1)}GB / {metrics?.disk.total.toFixed(1)}GB
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Network</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Requests/min:</span>
              <span className="font-medium">{metrics?.network.requests}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Errors:</span>
              <span className="font-medium text-red-600">{metrics?.network.errors}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Response:</span>
              <span className="font-medium">{metrics?.network.avgResponseTime.toFixed(0)}ms</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cache Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Hit Rate:</span>
              <span className="font-medium text-green-600">{metrics?.cache.hitRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Size:</span>
              <span className="font-medium">{metrics?.cache.size.toFixed(0)}MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Max Size:</span>
              <span className="font-medium">{metrics?.cache.maxSize}MB</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Connections:</span>
              <span className="font-medium">{metrics?.database.connections}/{metrics?.database.maxConnections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Query:</span>
              <span className="font-medium">{metrics?.database.avgQueryTime.toFixed(0)}ms</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Service Health Checks</CardTitle>
          <CardDescription>Status of critical system components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {healthChecks.map((check, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge className={getStatusColor(check.status)}>
                    {check.status.toUpperCase()}
                  </Badge>
                  <div>
                    <h3 className="font-medium">{check.service}</h3>
                    <p className="text-sm text-gray-500">{check.message}</p>
                  </div>
                </div>
                <div className="text-right">
                  {check.responseTime && (
                    <div className="text-sm font-medium">{check.responseTime}ms</div>
                  )}
                  <div className="text-xs text-gray-500">
                    {new Date(check.lastCheck).toLocaleTimeString()}
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
