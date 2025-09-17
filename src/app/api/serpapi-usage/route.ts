import { NextRequest, NextResponse } from 'next/server';
import { serpApiMonitor } from '@/lib/utils/serpapi-monitor';
import fs from 'fs';
import path from 'path';

const STORAGE_FILE = path.join(process.cwd(), '.serpapi-usage.json');

interface SerpApiUsageData {
  dailyCalls: Record<string, number>;
  monthlyCalls: Record<string, number>;
  lastUpdated: string;
}

function getStorageData(): SerpApiUsageData {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const content = fs.readFileSync(STORAGE_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn('Failed to read SerpAPI usage data:', error);
  }

  return {
    dailyCalls: {},
    monthlyCalls: {},
    lastUpdated: new Date().toISOString()
  };
}

function saveStorageData(data: SerpApiUsageData): void {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.warn('Failed to save SerpAPI usage data:', error);
  }
}

function getDateKey(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function getMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
}

// GET /api/serpapi-usage - Get SerpApi usage statistics
export async function GET(request: NextRequest) {
  try {
    const data = getStorageData();
    const today = getDateKey();
    const thisMonth = getMonthKey();

    const dailyUsage = data.dailyCalls[today] || 0;
    const monthlyUsage = data.monthlyCalls[thisMonth] || 0;

    const MONTHLY_LIMIT = 250;
    const WEEKDAY_LIMIT = 8;
    const WEEKEND_LIMIT = 6;

    const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
    const dailyLimit = isWeekend ? WEEKEND_LIMIT : WEEKDAY_LIMIT;

    const monthlyPercentage = (monthlyUsage / MONTHLY_LIMIT) * 100;
    const dailyPercentage = (dailyUsage / dailyLimit) * 100;

    let status = 'safe';
    if (monthlyPercentage >= 90) status = 'critical';
    else if (monthlyPercentage >= 70) status = 'warning';

    const stats = {
      today: {
        count: dailyUsage,
        limit: dailyLimit,
        percentage: dailyPercentage,
        remaining: Math.max(0, dailyLimit - dailyUsage)
      },
      thisMonth: {
        count: monthlyUsage,
        limit: MONTHLY_LIMIT,
        percentage: monthlyPercentage,
        remaining: Math.max(0, MONTHLY_LIMIT - monthlyUsage),
        recommendedDailyLimit: Math.floor((MONTHLY_LIMIT - monthlyUsage) / (31 - new Date().getDate() + 1))
      },
      status,
      canMakeCall: dailyUsage < dailyLimit && monthlyUsage < MONTHLY_LIMIT
    };

    return NextResponse.json({
      success: true,
      data: {
        stats,
        canMakeCall: stats.canMakeCall,
        recommendations: generateRecommendations(stats)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching SerpApi usage:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch SerpApi usage statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/serpapi-usage - Record a SerpApi call
export async function POST(request: NextRequest) {
  try {
    const data = getStorageData();
    const today = getDateKey();
    const thisMonth = getMonthKey();

    // Increment counters
    data.dailyCalls[today] = (data.dailyCalls[today] || 0) + 1;
    data.monthlyCalls[thisMonth] = (data.monthlyCalls[thisMonth] || 0) + 1;
    data.lastUpdated = new Date().toISOString();

    // Clean up old data (keep only last 60 days and 12 months)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 60);
    const cutoffDateKey = cutoffDate.toISOString().split('T')[0];

    Object.keys(data.dailyCalls).forEach(key => {
      if (key < cutoffDateKey) {
        delete data.dailyCalls[key];
      }
    });

    const cutoffMonth = new Date();
    cutoffMonth.setMonth(cutoffMonth.getMonth() - 12);
    const cutoffMonthKey = `${cutoffMonth.getFullYear()}-${String(cutoffMonth.getMonth() + 1).padStart(2, '0')}`;

    Object.keys(data.monthlyCalls).forEach(key => {
      if (key < cutoffMonthKey) {
        delete data.monthlyCalls[key];
      }
    });

    saveStorageData(data);

    console.log(`📊 SerpAPI call recorded: Daily: ${data.dailyCalls[today]}, Monthly: ${data.monthlyCalls[thisMonth]}`);

    return NextResponse.json({
      success: true,
      data: {
        dailyUsage: data.dailyCalls[today],
        monthlyUsage: data.monthlyCalls[thisMonth]
      }
    });

  } catch (error) {
    console.error('❌ Error recording SerpApi usage:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to record SerpApi usage',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(stats: any): string[] {
  const recommendations: string[] = [];
  
  if (stats.status === 'critical') {
    recommendations.push('🚨 Critical: Monthly limit almost reached. Consider upgrading plan or reducing usage.');
    recommendations.push('💡 Increase cache duration to 4-6 hours to reduce API calls.');
  } else if (stats.status === 'warning') {
    recommendations.push('⚠️ Warning: 70% of monthly quota used. Monitor usage closely.');
    recommendations.push('💡 Consider extending cache duration during peak usage periods.');
  } else {
    recommendations.push('✅ Usage is within safe limits. Continue current strategy.');
  }
  
  if (stats.today.count >= stats.today.limit) {
    recommendations.push('📅 Daily limit reached. API calls will use fallback RSS feed today.');
  }
  
  if (stats.thisMonth.recommendedDailyLimit < 5) {
    recommendations.push('📊 Recommended daily limit is very low. Consider upgrading SerpApi plan.');
  }
  
  return recommendations;
}
