'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'api_abuse' | 'suspicious_activity' | 'rate_limit' | 'blocked_ip';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  ip: string;
  userAgent?: string;
  timestamp: Date;
  resolved: boolean;
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  blockedIPs: number;
  rateLimitHits: number;
  lastScan: Date;
  vulnerabilities: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
  }>;
  securityScore: number;
}

export const SecurityPanel: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanInProgress, setScanInProgress] = useState(false);

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchSecurityData = async () => {
    try {
      // Mock security events - in production, fetch from security monitoring system
      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
          type: 'rate_limit',
          severity: 'medium',
          message: 'Rate limit exceeded for API endpoint /api/automation',
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: new Date(Date.now() - 300000), // 5 minutes ago
          resolved: false
        },
        {
          id: '2',
          type: 'suspicious_activity',
          severity: 'high',
          message: 'Suspicious API access pattern detected',
          ip: '10.0.0.50',
          userAgent: 'curl/7.68.0',
          timestamp: new Date(Date.now() - 900000), // 15 minutes ago
          resolved: true
        },
        {
          id: '3',
          type: 'api_abuse',
          severity: 'medium',
          message: 'Unusual API usage pattern detected',
          ip: '172.16.0.25',
          timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
          resolved: false
        },
        {
          id: '4',
          type: 'blocked_ip',
          severity: 'low',
          message: 'IP address blocked due to suspicious activity',
          ip: '203.0.113.0',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          resolved: true
        }
      ];

      const mockMetrics: SecurityMetrics = {
        totalEvents: mockEvents.length,
        criticalEvents: mockEvents.filter(e => e.severity === 'critical').length,
        blockedIPs: 12,
        rateLimitHits: 45,
        lastScan: new Date(Date.now() - 1800000), // 30 minutes ago
        vulnerabilities: [
          {
            type: 'Outdated Dependencies',
            severity: 'medium',
            description: '3 npm packages have known security vulnerabilities',
            recommendation: 'Run npm audit fix to update vulnerable packages'
          },
          {
            type: 'Missing Security Headers',
            severity: 'low',
            description: 'Some security headers could be strengthened',
            recommendation: 'Review and update Content Security Policy'
          }
        ],
        securityScore: 85
      };

      setEvents(mockEvents);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runSecurityScan = async () => {
    setScanInProgress(true);
    try {
      // Mock security scan - in production, trigger actual security scan
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update last scan time
      if (metrics) {
        setMetrics({
          ...metrics,
          lastScan: new Date()
        });
      }
    } catch (error) {
      console.error('Security scan failed:', error);
    } finally {
      setScanInProgress(false);
    }
  };

  const resolveEvent = async (eventId: string) => {
    try {
      setEvents(prev => prev.map(event => 
        event.id === eventId ? { ...event, resolved: true } : event
      ));
    } catch (error) {
      console.error('Failed to resolve event:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login_attempt': return '🔐';
      case 'api_abuse': return '⚠️';
      case 'suspicious_activity': return '🚨';
      case 'rate_limit': return '⏱️';
      case 'blocked_ip': return '🚫';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Security Panel</h2>
          <p className="text-gray-600">Monitor security events and system vulnerabilities</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="secondary"
            onClick={runSecurityScan}
            disabled={scanInProgress}
          >
            {scanInProgress ? 'Scanning...' : 'Run Security Scan'}
          </Button>
          <Button variant="secondary" onClick={fetchSecurityData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className={`text-2xl font-bold ${getScoreColor(metrics?.securityScore || 0)}`}>
              {metrics?.securityScore || 0}%
            </div>
            <div className="text-sm text-gray-500">Security Score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-600">{metrics?.criticalEvents || 0}</div>
            <div className="text-sm text-gray-500">Critical Events</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">{metrics?.blockedIPs || 0}</div>
            <div className="text-sm text-gray-500">Blocked IPs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-yellow-600">{metrics?.rateLimitHits || 0}</div>
            <div className="text-sm text-gray-500">Rate Limit Hits</div>
          </CardContent>
        </Card>
      </div>

      {/* Vulnerabilities */}
      {metrics?.vulnerabilities && metrics.vulnerabilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Security Vulnerabilities</CardTitle>
            <CardDescription>Issues that require attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.vulnerabilities.map((vuln, index) => (
                <div key={index} className="border-l-4 border-red-400 pl-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-gray-900">{vuln.type}</h3>
                    <Badge className={getSeverityColor(vuln.severity)}>
                      {vuln.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{vuln.description}</p>
                  <p className="text-sm text-blue-600">💡 {vuln.recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>
            Latest security incidents and monitoring alerts
            {metrics?.lastScan && (
              <span className="ml-2 text-xs text-gray-500">
                Last scan: {metrics.lastScan.toLocaleString()}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No security events detected
              </div>
            ) : (
              events.map((event) => (
                <div key={event.id} className={`p-4 border rounded-lg ${event.resolved ? 'bg-gray-50' : 'bg-white'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{getEventIcon(event.type)}</span>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900">{event.message}</h3>
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity.toUpperCase()}
                          </Badge>
                          {event.resolved && (
                            <Badge className="bg-green-100 text-green-800">
                              RESOLVED
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 space-x-4">
                          <span>IP: {event.ip}</span>
                          <span>{event.timestamp.toLocaleString()}</span>
                          {event.userAgent && (
                            <span className="block mt-1 truncate max-w-md">
                              User Agent: {event.userAgent}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!event.resolved && (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => resolveEvent(event.id)}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Security Recommendations</CardTitle>
          <CardDescription>Best practices to improve system security</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">✅</span>
              <span className="text-sm">HTTPS enabled with valid SSL certificate</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">✅</span>
              <span className="text-sm">Security headers configured (CSP, HSTS, etc.)</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">✅</span>
              <span className="text-sm">Rate limiting implemented on API endpoints</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-yellow-500 mt-1">⚠️</span>
              <span className="text-sm">Consider implementing 2FA for admin access</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-yellow-500 mt-1">⚠️</span>
              <span className="text-sm">Regular security audits recommended</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 mt-1">💡</span>
              <span className="text-sm">Monitor for new CVEs in dependencies</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
