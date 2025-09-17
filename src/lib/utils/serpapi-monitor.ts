/**
 * SerpApi Usage Monitor
 * Tracks and manages SerpApi usage to stay within 250 searches/month limit
 */

export interface SerpApiUsage {
  date: string;
  count: number;
  limit: number;
  isWeekend: boolean;
}

export interface SerpApiStats {
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

class SerpApiMonitor {
  private readonly MONTHLY_LIMIT = 250;
  private readonly WEEKDAY_LIMIT = 8;
  private readonly WEEKEND_LIMIT = 6;

  /**
   * Get current usage statistics
   */
  getUsageStats(): SerpApiStats {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const isWeekend = today.getDay() === 0 || today.getDay() === 6;
    
    // Get today's usage
    const todayUsage = this.getTodayUsage();
    const todayLimit = isWeekend ? this.WEEKEND_LIMIT : this.WEEKDAY_LIMIT;
    
    // Get monthly usage
    const monthlyUsage = this.getMonthlyUsage();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysPassed = today.getDate();
    const remainingDays = daysInMonth - daysPassed;
    
    const averagePerDay = daysPassed > 0 ? monthlyUsage / daysPassed : 0;
    const remainingQuota = this.MONTHLY_LIMIT - monthlyUsage;
    const recommendedDailyLimit = remainingDays > 0 ? Math.floor(remainingQuota / remainingDays) : 0;
    
    // Determine status
    let status: 'safe' | 'warning' | 'critical' = 'safe';
    if (monthlyUsage > this.MONTHLY_LIMIT * 0.9) {
      status = 'critical';
    } else if (monthlyUsage > this.MONTHLY_LIMIT * 0.7) {
      status = 'warning';
    }

    return {
      today: {
        date: todayStr,
        count: todayUsage,
        limit: todayLimit,
        isWeekend
      },
      thisMonth: {
        totalUsed: monthlyUsage,
        totalLimit: this.MONTHLY_LIMIT,
        remainingDays,
        averagePerDay: Math.round(averagePerDay * 10) / 10,
        recommendedDailyLimit
      },
      status
    };
  }

  /**
   * Check if we can make a SerpApi call today
   */
  canMakeCall(): boolean {
    const stats = this.getUsageStats();
    
    // Check daily limit
    if (stats.today.count >= stats.today.limit) {
      console.log(`🚫 Daily SerpApi limit reached: ${stats.today.count}/${stats.today.limit}`);
      return false;
    }
    
    // Check monthly limit
    if (stats.thisMonth.totalUsed >= this.MONTHLY_LIMIT) {
      console.log(`🚫 Monthly SerpApi limit reached: ${stats.thisMonth.totalUsed}/${this.MONTHLY_LIMIT}`);
      return false;
    }
    
    return true;
  }

  /**
   * Record a successful SerpApi call
   */
  recordCall(): void {
    const today = new Date().toISOString().split('T')[0];
    const key = `serpapi_usage_${today}`;
    
    const currentUsage = this.getStorageValue(key, 0);
    this.setStorageValue(key, currentUsage + 1);
    
    // Also update monthly counter
    const monthKey = `serpapi_monthly_${today.substring(0, 7)}`; // YYYY-MM
    const monthlyUsage = this.getStorageValue(monthKey, 0);
    this.setStorageValue(monthKey, monthlyUsage + 1);
    
    const stats = this.getUsageStats();
    console.log(`📊 SerpApi call recorded: ${stats.today.count}/${stats.today.limit} today, ${stats.thisMonth.totalUsed}/${this.MONTHLY_LIMIT} this month`);
  }

  /**
   * Get usage report for admin dashboard
   */
  getUsageReport(): string {
    const stats = this.getUsageStats();
    const statusEmoji = {
      safe: '✅',
      warning: '⚠️',
      critical: '🚨'
    };

    return `
${statusEmoji[stats.status]} **SerpApi Usage Report**

**Today (${stats.today.date}):**
- Used: ${stats.today.count}/${stats.today.limit} calls
- Type: ${stats.today.isWeekend ? 'Weekend' : 'Weekday'} limit

**This Month:**
- Used: ${stats.thisMonth.totalUsed}/${stats.thisMonth.totalLimit} calls (${Math.round(stats.thisMonth.totalUsed / stats.thisMonth.totalLimit * 100)}%)
- Average: ${stats.thisMonth.averagePerDay} calls/day
- Remaining days: ${stats.thisMonth.remainingDays}
- Recommended daily limit: ${stats.thisMonth.recommendedDailyLimit} calls

**Status:** ${stats.status.toUpperCase()}
    `.trim();
  }

  private getTodayUsage(): number {
    const today = new Date().toISOString().split('T')[0];
    const key = `serpapi_usage_${today}`;
    return this.getStorageValue(key, 0);
  }

  private getMonthlyUsage(): number {
    const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const key = `serpapi_monthly_${thisMonth}`;
    return this.getStorageValue(key, 0);
  }

  private getStorageValue(key: string, defaultValue: number): number {
    if (typeof window !== 'undefined') {
      // Client-side: use localStorage
      const stored = localStorage.getItem(key);
      return stored ? parseInt(stored, 10) : defaultValue;
    } else {
      // Server-side: return default values - actual tracking will be done via API
      return defaultValue;
    }
  }

  private setStorageValue(key: string, value: number): void {
    if (typeof window !== 'undefined') {
      // Client-side: use localStorage
      localStorage.setItem(key, value.toString());
    } else {
      // Server-side: no-op - actual tracking will be done via API
    }
  }
}

export const serpApiMonitor = new SerpApiMonitor();
export default serpApiMonitor;
