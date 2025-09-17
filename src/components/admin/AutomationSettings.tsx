'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Input } from '@/components/ui/Input';

interface AutomationConfig {
  enabled: boolean;
  interval: number; // minutes
  maxArticlesPerDay: number;
  minConfidenceScore: number;
  minGrowthRate: number;
  categories: string[];
  schedule: {
    enabled: boolean;
    timezone: string;
    workingHours: {
      start: string; // HH:MM format
      end: string;   // HH:MM format
    };
    workingDays: number[]; // 0-6, Sunday = 0
  };
  contentSettings: {
    minWordCount: number;
    maxWordCount: number;
    includeImages: boolean;
    includeSources: boolean;
    seoOptimization: boolean;
  };
  qualityFilters: {
    duplicateCheck: boolean;
    sentimentFilter: boolean;
    factCheck: boolean;
    readabilityScore: number;
  };
}

interface AutomationStats {
  isRunning: boolean;
  nextRun: string;
  lastRun: string;
  todayGenerated: number;
  weeklyGenerated: number;
  monthlyGenerated: number;
  successRate: number;
  averageQualityScore: number;
}

export function AutomationSettings() {
  const [config, setConfig] = useState<AutomationConfig | null>(null);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'schedule' | 'content' | 'quality'>('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [configRes, statsRes] = await Promise.all([
        fetch('/api/automation/config'),
        fetch('/api/automation/stats')
      ]);

      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData.data);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const response = await fetch('/api/automation/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        await fetchSettings();
      }
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (path: string, value: any) => {
    if (!config) return;

    const keys = path.split('.');
    const newConfig = { ...config };
    let current: any = newConfig;

    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  };

  const formatNextRun = (nextRun: string) => {
    const date = new Date(nextRun);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `${diffMins} minutes`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)} hours`;
    } else {
      return `${Math.floor(diffMins / 1440)} days`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-text">Automation Settings</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text">Automation Settings</h2>
          <div className="flex items-center gap-3">
            <Badge variant={stats?.isRunning ? 'success' : 'secondary'}>
              {stats?.isRunning ? 'RUNNING' : 'STOPPED'}
            </Badge>
            <Button
              variant="primary"
              onClick={handleSaveConfig}
              disabled={saving}
            >
              {saving ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Save Settings
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-text">{stats.todayGenerated}</div>
              <div className="text-xs text-text-secondary">Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text">{stats.weeklyGenerated}</div>
              <div className="text-xs text-text-secondary">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.successRate}%</div>
              <div className="text-xs text-text-secondary">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.averageQualityScore}</div>
              <div className="text-xs text-text-secondary">Avg Quality</div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2">
          {[
            { key: 'general', label: 'General' },
            { key: 'schedule', label: 'Schedule' },
            { key: 'content', label: 'Content' },
            { key: 'quality', label: 'Quality' }
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'primary' : 'text'}
              size="sm"
              onClick={() => setActiveTab(tab.key as any)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {config && (
          <div className="space-y-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text">Enable Automation</label>
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => updateConfig('enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Generation Interval (minutes)
                  </label>
                  <Input
                    type="number"
                    value={config.interval}
                    onChange={(e) => updateConfig('interval', parseInt(e.target.value))}
                    min="5"
                    max="1440"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Max Articles Per Day
                  </label>
                  <Input
                    type="number"
                    value={config.maxArticlesPerDay}
                    onChange={(e) => updateConfig('maxArticlesPerDay', parseInt(e.target.value))}
                    min="1"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Min Confidence Score (%)
                  </label>
                  <Input
                    type="number"
                    value={config.minConfidenceScore}
                    onChange={(e) => updateConfig('minConfidenceScore', parseInt(e.target.value))}
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Min Growth Rate (%)
                  </label>
                  <Input
                    type="number"
                    value={config.minGrowthRate}
                    onChange={(e) => updateConfig('minGrowthRate', parseInt(e.target.value))}
                    min="0"
                    max="1000"
                  />
                </div>
              </div>
            )}

            {/* Schedule Settings */}
            {activeTab === 'schedule' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text">Enable Schedule</label>
                  <input
                    type="checkbox"
                    checked={config.schedule.enabled}
                    onChange={(e) => updateConfig('schedule.enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Timezone</label>
                  <select
                    value={config.schedule.timezone}
                    onChange={(e) => updateConfig('schedule.timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-light rounded-lg bg-white text-text"
                  >
                    <option value="UTC">UTC</option>
                    <option value="Europe/Prague">Europe/Prague</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">Start Time</label>
                    <Input
                      type="time"
                      value={config.schedule.workingHours.start}
                      onChange={(e) => updateConfig('schedule.workingHours.start', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">End Time</label>
                    <Input
                      type="time"
                      value={config.schedule.workingHours.end}
                      onChange={(e) => updateConfig('schedule.workingHours.end', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Working Days</label>
                  <div className="flex gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <label key={day} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={config.schedule.workingDays.includes(index)}
                          onChange={(e) => {
                            const days = [...config.schedule.workingDays];
                            if (e.target.checked) {
                              days.push(index);
                            } else {
                              const idx = days.indexOf(index);
                              if (idx > -1) days.splice(idx, 1);
                            }
                            updateConfig('schedule.workingDays', days);
                          }}
                          className="w-3 h-3"
                        />
                        <span className="text-xs">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {stats && (
                  <div className="p-3 bg-surface rounded-lg">
                    <div className="text-sm text-text-secondary">
                      Next run: {stats.nextRun ? formatNextRun(stats.nextRun) : 'Not scheduled'}
                    </div>
                    <div className="text-sm text-text-secondary">
                      Last run: {stats.lastRun ? new Date(stats.lastRun).toLocaleString() : 'Never'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Content Settings */}
            {activeTab === 'content' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">Min Word Count</label>
                    <Input
                      type="number"
                      value={config.contentSettings.minWordCount}
                      onChange={(e) => updateConfig('contentSettings.minWordCount', parseInt(e.target.value))}
                      min="100"
                      max="5000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">Max Word Count</label>
                    <Input
                      type="number"
                      value={config.contentSettings.maxWordCount}
                      onChange={(e) => updateConfig('contentSettings.maxWordCount', parseInt(e.target.value))}
                      min="500"
                      max="10000"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-text">Include Images</label>
                    <input
                      type="checkbox"
                      checked={config.contentSettings.includeImages}
                      onChange={(e) => updateConfig('contentSettings.includeImages', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-text">Include Sources</label>
                    <input
                      type="checkbox"
                      checked={config.contentSettings.includeSources}
                      onChange={(e) => updateConfig('contentSettings.includeSources', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-text">SEO Optimization</label>
                    <input
                      type="checkbox"
                      checked={config.contentSettings.seoOptimization}
                      onChange={(e) => updateConfig('contentSettings.seoOptimization', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Categories</label>
                  <div className="flex flex-wrap gap-2">
                    {['Technology', 'News', 'Business', 'Science', 'Health', 'Sports', 'Entertainment'].map((category) => (
                      <label key={category} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={config.categories.includes(category)}
                          onChange={(e) => {
                            const categories = [...config.categories];
                            if (e.target.checked) {
                              categories.push(category);
                            } else {
                              const idx = categories.indexOf(category);
                              if (idx > -1) categories.splice(idx, 1);
                            }
                            updateConfig('categories', categories);
                          }}
                          className="w-3 h-3"
                        />
                        <span className="text-xs">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quality Settings */}
            {activeTab === 'quality' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-text">Duplicate Check</label>
                    <input
                      type="checkbox"
                      checked={config.qualityFilters.duplicateCheck}
                      onChange={(e) => updateConfig('qualityFilters.duplicateCheck', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-text">Sentiment Filter</label>
                    <input
                      type="checkbox"
                      checked={config.qualityFilters.sentimentFilter}
                      onChange={(e) => updateConfig('qualityFilters.sentimentFilter', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-text">Fact Check</label>
                    <input
                      type="checkbox"
                      checked={config.qualityFilters.factCheck}
                      onChange={(e) => updateConfig('qualityFilters.factCheck', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Min Readability Score (0-100)
                  </label>
                  <Input
                    type="number"
                    value={config.qualityFilters.readabilityScore}
                    onChange={(e) => updateConfig('qualityFilters.readabilityScore', parseInt(e.target.value))}
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
