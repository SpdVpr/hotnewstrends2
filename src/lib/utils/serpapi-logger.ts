/**
 * SerpAPI Usage Logger
 * Centralized logging for all SerpAPI calls to track usage patterns
 */

export interface SerpApiCallLog {
  timestamp: string;
  endpoint: string;
  keyword?: string;
  region?: string;
  engine: string;
  success: boolean;
  error?: string;
  responseTime?: number;
}

class SerpApiLogger {
  private logs: SerpApiCallLog[] = [];
  private readonly MAX_LOGS = 1000; // Keep last 1000 calls

  /**
   * Log a SerpAPI call
   */
  logCall(log: SerpApiCallLog): void {
    this.logs.unshift({
      ...log,
      timestamp: new Date().toISOString()
    });

    // Keep only recent logs
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(0, this.MAX_LOGS);
    }

    // Console log for debugging
    const status = log.success ? '✅' : '❌';
    const timing = log.responseTime ? ` (${log.responseTime}ms)` : '';
    const keyword = log.keyword ? ` "${log.keyword}"` : '';
    
    console.log(`${status} SerpAPI [${log.engine}] ${log.endpoint}${keyword}${timing}`);
    
    if (!log.success && log.error) {
      console.error(`   Error: ${log.error}`);
    }
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 50): SerpApiCallLog[] {
    return this.logs.slice(0, limit);
  }

  /**
   * Get logs for today
   */
  getTodayLogs(): SerpApiCallLog[] {
    const today = new Date().toISOString().split('T')[0];
    return this.logs.filter(log => log.timestamp.startsWith(today));
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): {
    today: {
      total: number;
      successful: number;
      failed: number;
      byEndpoint: Record<string, number>;
      byEngine: Record<string, number>;
    };
    recent: {
      total: number;
      successful: number;
      failed: number;
      averageResponseTime: number;
    };
  } {
    const todayLogs = this.getTodayLogs();
    const recentLogs = this.logs.slice(0, 100); // Last 100 calls

    // Today stats
    const todayByEndpoint: Record<string, number> = {};
    const todayByEngine: Record<string, number> = {};
    
    todayLogs.forEach(log => {
      todayByEndpoint[log.endpoint] = (todayByEndpoint[log.endpoint] || 0) + 1;
      todayByEngine[log.engine] = (todayByEngine[log.engine] || 0) + 1;
    });

    // Recent stats
    const recentWithTiming = recentLogs.filter(log => log.responseTime);
    const averageResponseTime = recentWithTiming.length > 0
      ? recentWithTiming.reduce((sum, log) => sum + (log.responseTime || 0), 0) / recentWithTiming.length
      : 0;

    return {
      today: {
        total: todayLogs.length,
        successful: todayLogs.filter(log => log.success).length,
        failed: todayLogs.filter(log => !log.success).length,
        byEndpoint: todayByEndpoint,
        byEngine: todayByEngine
      },
      recent: {
        total: recentLogs.length,
        successful: recentLogs.filter(log => log.success).length,
        failed: recentLogs.filter(log => !log.success).length,
        averageResponseTime: Math.round(averageResponseTime)
      }
    };
  }

  /**
   * Get detailed report for admin dashboard
   */
  getDetailedReport(): string {
    const stats = this.getUsageStats();
    const todayLogs = this.getTodayLogs();
    
    let report = `📊 **SerpAPI Usage Report**\n\n`;
    
    // Today's summary
    report += `**Today (${new Date().toISOString().split('T')[0]}):**\n`;
    report += `- Total calls: ${stats.today.total}\n`;
    report += `- Successful: ${stats.today.successful} ✅\n`;
    report += `- Failed: ${stats.today.failed} ❌\n\n`;
    
    // By endpoint
    if (Object.keys(stats.today.byEndpoint).length > 0) {
      report += `**By Endpoint:**\n`;
      Object.entries(stats.today.byEndpoint)
        .sort(([,a], [,b]) => b - a)
        .forEach(([endpoint, count]) => {
          report += `- ${endpoint}: ${count} calls\n`;
        });
      report += `\n`;
    }
    
    // By engine
    if (Object.keys(stats.today.byEngine).length > 0) {
      report += `**By Engine:**\n`;
      Object.entries(stats.today.byEngine)
        .sort(([,a], [,b]) => b - a)
        .forEach(([engine, count]) => {
          report += `- ${engine}: ${count} calls\n`;
        });
      report += `\n`;
    }
    
    // Recent performance
    report += `**Recent Performance (last ${stats.recent.total} calls):**\n`;
    report += `- Success rate: ${Math.round(stats.recent.successful / stats.recent.total * 100)}%\n`;
    report += `- Average response time: ${stats.recent.averageResponseTime}ms\n\n`;
    
    // Recent calls
    if (todayLogs.length > 0) {
      report += `**Recent Calls:**\n`;
      todayLogs.slice(0, 10).forEach(log => {
        const status = log.success ? '✅' : '❌';
        const time = new Date(log.timestamp).toLocaleTimeString();
        const keyword = log.keyword ? ` "${log.keyword}"` : '';
        report += `- ${time} ${status} ${log.endpoint}${keyword}\n`;
      });
    }
    
    return report;
  }

  /**
   * Clear old logs (keep only recent ones)
   */
  clearOldLogs(): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7); // Keep last 7 days
    
    const cutoffStr = cutoff.toISOString();
    const before = this.logs.length;
    
    this.logs = this.logs.filter(log => log.timestamp >= cutoffStr);
    
    const after = this.logs.length;
    console.log(`🧹 SerpAPI logs cleaned: ${before - after} old logs removed, ${after} kept`);
  }
}

// Export singleton instance
export const serpApiLogger = new SerpApiLogger();
