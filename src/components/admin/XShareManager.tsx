'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AlertCircle, CheckCircle, Share, TestTube, RefreshCw } from 'lucide-react';

interface ShareStats {
  todayShares: number;
  remainingShares: number;
  totalShares: number;
}

interface XAutomationStats {
  todayShares: number;
  remainingShares: number;
  totalShares: number;
  lastShareTime?: string;
  nextShareTime?: string;
  isRunning: boolean;
}

interface XAutomationData {
  stats: XAutomationStats;
  config: {
    enabled: boolean;
    dailyShareLimit: number;
    shareInterval: number;
  };
  timeUntilNext: string;
}

interface ShareResult {
  success: boolean;
  articlesShared: number;
  errors: string[];
  rateLimitHit?: boolean;
}

interface TestResult {
  success: boolean;
  user?: {
    id: string;
    name: string;
    username: string;
  };
  error?: string;
}

export default function XShareManager() {
  const [stats, setStats] = useState<ShareStats | null>(null);
  const [automationData, setAutomationData] = useState<XAutomationData | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isAutomationLoading, setIsAutomationLoading] = useState(false);
  const [lastShareResult, setLastShareResult] = useState<ShareResult | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Load stats on component mount
  useEffect(() => {
    loadStats();
    loadAutomationData();
  }, []);

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch('/api/x-share');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        console.error('Failed to load stats:', data.error);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadAutomationData = async () => {
    try {
      const response = await fetch('/api/x-automation');
      const data = await response.json();

      if (data.success) {
        setAutomationData(data.data);
      } else {
        console.error('Failed to load automation data:', data.error);
      }
    } catch (error) {
      console.error('Error loading automation data:', error);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    setLastShareResult(null);
    
    try {
      const response = await fetch('/api/x-share', {
        method: 'POST',
      });
      
      const result = await response.json();
      setLastShareResult(result);
      
      // Reload stats after sharing
      await loadStats();
      await loadAutomationData();
      
    } catch (error: any) {
      setLastShareResult({
        success: false,
        articlesShared: 0,
        errors: [error.message || 'Network error']
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/x-test');
      const result = await response.json();
      setTestResult(result);
      
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message || 'Network error'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleAutomationAction = async (action: 'start' | 'stop' | 'restart') => {
    setIsAutomationLoading(true);
    try {
      const response = await fetch('/api/x-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      const result = await response.json();
      if (result.success) {
        await loadAutomationData();
      } else {
        console.error('Automation action failed:', result.error);
      }

    } catch (error: any) {
      console.error('Automation action error:', error);
    } finally {
      setIsAutomationLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">X (Twitter) Share Manager</h2>
          <p className="text-gray-600">Manage automatic sharing of articles to X</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleTest}
            disabled={isTesting}
            variant="outline"
            size="sm"
          >
            <TestTube className="w-4 h-4 mr-2" />
            {isTesting ? 'Testing...' : 'Test Connection'}
          </Button>
          <Button
            onClick={() => {
              loadStats();
              loadAutomationData();
            }}
            disabled={isLoadingStats}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Automation Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Automatic Sharing
            {automationData?.stats.isRunning ? (
              <Badge variant="default">Running</Badge>
            ) : (
              <Badge variant="secondary">Stopped</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Automatically share articles every {automationData?.config.shareInterval || 360} minutes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={() => handleAutomationAction(automationData?.stats.isRunning ? 'stop' : 'start')}
              disabled={isAutomationLoading}
              variant={automationData?.stats.isRunning ? "secondary" : "default"}
            >
              {isAutomationLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : automationData?.stats.isRunning ? (
                <>⏸️ Stop Automation</>
              ) : (
                <>▶️ Start Automation</>
              )}
            </Button>

            <Button
              onClick={() => handleAutomationAction('restart')}
              disabled={isAutomationLoading}
              variant="outline"
            >
              🔄 Restart
            </Button>
          </div>

          {automationData && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Next Share:</span>
                <div className="font-medium">
                  {automationData.stats.isRunning ? automationData.timeUntilNext : 'Not scheduled'}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Last Share:</span>
                <div className="font-medium">
                  {automationData.stats.lastShareTime
                    ? new Date(automationData.stats.lastShareTime).toLocaleString()
                    : 'Never'
                  }
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connection Test Result */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              Connection Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResult.success ? (
              <div className="space-y-2">
                <p className="text-green-600">✅ X API connection successful!</p>
                {testResult.user && (
                  <div className="text-sm text-gray-600">
                    <p><strong>Account:</strong> @{testResult.user.username}</p>
                    <p><strong>Name:</strong> {testResult.user.name}</p>
                    <p><strong>ID:</strong> {testResult.user.id}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-red-600">❌ {testResult.error}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Shares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '...' : stats?.todayShares || 0}
            </div>
            <p className="text-xs text-gray-500">out of 4 daily limit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Remaining Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '...' : stats?.remainingShares || 0}
            </div>
            <p className="text-xs text-gray-500">shares available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '...' : stats?.totalShares || 0}
            </div>
            <p className="text-xs text-gray-500">all time</p>
          </CardContent>
        </Card>
      </div>

      {/* Share Button */}
      <Card>
        <CardHeader>
          <CardTitle>Share Articles</CardTitle>
          <CardDescription>
            Share unshared articles to X. Limited to {stats?.remainingShares || 0} shares today.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleShare}
            disabled={isSharing || (stats?.remainingShares || 0) <= 0}
            className="w-full"
          >
            <Share className="w-4 h-4 mr-2" />
            {isSharing ? 'Sharing...' : 'Share Articles Now'}
          </Button>
        </CardContent>
      </Card>

      {/* Last Share Result */}
      {lastShareResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {lastShareResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              Last Share Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={lastShareResult.success ? "default" : "destructive"}>
                  {lastShareResult.success ? 'Success' : 'Failed'}
                </Badge>
                <span className="text-sm">
                  {lastShareResult.articlesShared} articles shared
                </span>
                {lastShareResult.rateLimitHit && (
                  <Badge variant="outline">Rate Limited</Badge>
                )}
              </div>
              
              {lastShareResult.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-red-600 mb-1">Errors:</p>
                  <ul className="text-sm text-red-600 space-y-1">
                    {lastShareResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>To enable X sharing, add these environment variables:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li><code>X_API_KEY</code> - Your X API Key</li>
            <li><code>X_API_SECRET</code> - Your X API Secret</li>
            <li><code>X_ACCESS_TOKEN</code> - Your Access Token</li>
            <li><code>X_ACCESS_TOKEN_SECRET</code> - Your Access Token Secret</li>
          </ul>
          <p className="text-gray-600 mt-2">
            Free tier allows 17 posts per 24 hours. We limit to 4 per day to stay well within limits.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
