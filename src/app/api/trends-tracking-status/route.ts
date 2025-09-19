import { NextRequest, NextResponse } from 'next/server';

// GET /api/trends-tracking-status - Detailed trends tracking with schedule and indicators
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Checking trends tracking status...');
    
    // Define the exact schedule (7 times daily) - UTC times from vercel.json
    const updateSchedule = [
      { time: '07:00', description: 'First update (before first article at 08:00)' },
      { time: '09:20', description: 'Second update' },
      { time: '11:40', description: 'Third update' },
      { time: '14:00', description: 'Fourth update' },
      { time: '16:20', description: 'Fifth update' },
      { time: '18:40', description: 'Sixth update' },
      { time: '21:00', description: 'Last update (before final articles)' }
    ];
    
    // Get current time in Prague timezone
    const now = new Date();
    const pragueTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Prague"}));
    const pragueHour = pragueTime.getHours();
    const pragueMinute = pragueTime.getMinutes();
    const currentTimeMinutes = pragueHour * 60 + pragueMinute;

    // Calculate next scheduled update (using Prague time)
    let nextUpdate = null;
    let minutesUntilNext = null;

    // Convert UTC schedule to Prague time for comparison
    for (const schedule of updateSchedule) {
      const [utcHours, utcMinutes] = schedule.time.split(':').map(Number);
      // Convert UTC to Prague time
      const utcTime = new Date();
      utcTime.setUTCHours(utcHours, utcMinutes, 0, 0);
      const pragueScheduleTime = new Date(utcTime.toLocaleString("en-US", {timeZone: "Europe/Prague"}));
      const pragueScheduleHour = pragueScheduleTime.getHours();
      const pragueScheduleMinute = pragueScheduleTime.getMinutes();
      const scheduleTimeMinutes = pragueScheduleHour * 60 + pragueScheduleMinute;

      if (scheduleTimeMinutes > currentTimeMinutes) {
        nextUpdate = schedule;
        minutesUntilNext = scheduleTimeMinutes - currentTimeMinutes;
        break;
      }
    }

    // If no update today, next is tomorrow at 07:00 UTC (08:00/09:00 Prague)
    if (!nextUpdate) {
      nextUpdate = updateSchedule[0];
      const utcTime = new Date();
      utcTime.setUTCHours(7, 0, 0, 0);
      utcTime.setDate(utcTime.getDate() + 1); // Tomorrow
      const tomorrowPragueTime = new Date(utcTime.toLocaleString("en-US", {timeZone: "Europe/Prague"}));
      const tomorrowMinutes = tomorrowPragueTime.getHours() * 60 + tomorrowPragueTime.getMinutes();
      minutesUntilNext = (24 * 60) - currentTimeMinutes + tomorrowMinutes;
    }
    
    // Get latest trends from Firebase to check last update
    const { firebaseTrendsService } = await import('@/lib/services/firebase-trends');
    const latestTrends = await firebaseTrendsService.getLatestTrends(10);

    // Analyze last update time
    let lastUpdateInfo = null;
    if (latestTrends.length > 0) {
      const newestTrend = latestTrends[0];

      // Handle different date formats from Firebase
      let lastUpdateTime;
      if (newestTrend.createdAt && typeof newestTrend.createdAt === 'object' && newestTrend.createdAt.toDate) {
        // Firebase Timestamp
        lastUpdateTime = newestTrend.createdAt.toDate();
      } else if (newestTrend.createdAt) {
        // ISO string or other format
        lastUpdateTime = new Date(newestTrend.createdAt);
      } else {
        lastUpdateTime = new Date();
      }

      const minutesSinceUpdate = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60));

      lastUpdateInfo = {
        timestamp: lastUpdateTime.toISOString(),
        minutesAgo: minutesSinceUpdate,
        hoursAgo: Math.floor(minutesSinceUpdate / 60),
        trend: {
          title: newestTrend.title,
          source: newestTrend.source,
          searchVolume: newestTrend.searchVolume
        }
      };
    }
    
    // Get today's trend batches to check which updates actually happened
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get trends from today to analyze update patterns
    const todayTrends = latestTrends.filter(trend => {
      let trendDate;
      if (trend.createdAt && typeof trend.createdAt === 'object' && trend.createdAt.toDate) {
        trendDate = trend.createdAt.toDate();
      } else {
        trendDate = new Date(trend.createdAt);
      }
      return trendDate >= todayStart && trendDate <= todayEnd;
    });

    // Group trends by hour to detect update batches
    const updateBatches = new Map();
    todayTrends.forEach(trend => {
      let trendDate;
      if (trend.createdAt && typeof trend.createdAt === 'object' && trend.createdAt.toDate) {
        trendDate = trend.createdAt.toDate();
      } else {
        trendDate = new Date(trend.createdAt);
      }
      const hour = trendDate.getUTCHours();
      if (!updateBatches.has(hour)) {
        updateBatches.set(hour, []);
      }
      updateBatches.get(hour).push(trend);
    });

    // Determine update status for each scheduled time
    const scheduleWithStatus = updateSchedule.map(schedule => {
      const [utcHours, utcMinutes] = schedule.time.split(':').map(Number);

      // Calculate Prague time for this schedule
      const utcScheduleTime = new Date();
      utcScheduleTime.setUTCHours(utcHours, utcMinutes, 0, 0);
      const pragueScheduleTime = new Date(utcScheduleTime.toLocaleString("en-US", {timeZone: "Europe/Prague"}));
      const pragueHours = pragueScheduleTime.getHours();
      const pragueMinutes = pragueScheduleTime.getMinutes();
      const scheduleTimeMinutes = pragueHours * 60 + pragueMinutes;

      // Check if this update should have happened today
      const isPast = scheduleTimeMinutes < currentTimeMinutes;
      const isCurrent = Math.abs(scheduleTimeMinutes - currentTimeMinutes) <= 30; // Within 30 minutes
      const isNext = schedule === nextUpdate;

      // Determine status indicator
      let status = 'pending';
      let indicator = '⏳';
      let statusText = 'Pending';

      if (isPast) {
        // Check if we have trends from around this scheduled time (within 2 hours)
        const hasUpdateBatch = updateBatches.has(utcHours) ||
                              updateBatches.has(utcHours - 1) ||
                              updateBatches.has(utcHours + 1);

        if (hasUpdateBatch) {
          status = 'completed';
          indicator = '✅';
          statusText = 'Completed';
        } else {
          status = 'missed';
          indicator = '❌';
          statusText = 'Missed';
        }
      } else if (isCurrent) {
        status = 'running';
        indicator = '🔄';
        statusText = 'Running now';
      } else if (isNext) {
        status = 'next';
        indicator = '⏰';
        statusText = `Next (in ${minutesUntilNext} min)`;
      }

      return {
        ...schedule,
        status,
        indicator,
        statusText,
        isPast,
        isCurrent,
        isNext,
        utcTime: `${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')} UTC`,
        pragueTime: `${pragueHours.toString().padStart(2, '0')}:${pragueMinutes.toString().padStart(2, '0')} Prague`
      };
    });
    
    // Overall system status
    const recentUpdates = scheduleWithStatus.filter(s => s.status === 'completed').length;
    const missedUpdates = scheduleWithStatus.filter(s => s.status === 'missed').length;
    
    let systemStatus = 'healthy';
    let systemIndicator = '✅';
    let systemMessage = 'All updates running on schedule';
    
    if (missedUpdates > 2) {
      systemStatus = 'critical';
      systemIndicator = '🚨';
      systemMessage = `${missedUpdates} updates missed - scheduler may be broken`;
    } else if (missedUpdates > 0) {
      systemStatus = 'warning';
      systemIndicator = '⚠️';
      systemMessage = `${missedUpdates} updates missed recently`;
    } else if (recentUpdates === 0 && lastUpdateInfo && lastUpdateInfo.hoursAgo > 4) {
      systemStatus = 'stale';
      systemIndicator = '🔶';
      systemMessage = `No recent updates - last update ${lastUpdateInfo.hoursAgo}h ago`;
    }
    
    return NextResponse.json({
      success: true,
      data: {
        currentTime: {
          utc: now.toISOString(),
          utcFormatted: `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')} UTC`,
          pragueFormatted: `${pragueHour.toString().padStart(2, '0')}:${pragueMinute.toString().padStart(2, '0')} Prague`,
          minutesSinceMidnight: currentTimeMinutes,
          pragueTime: pragueTime.toISOString()
        },
        systemStatus: {
          status: systemStatus,
          indicator: systemIndicator,
          message: systemMessage,
          recentUpdates,
          missedUpdates
        },
        nextUpdate: {
          ...nextUpdate,
          minutesUntil: minutesUntilNext,
          hoursUntil: Math.floor(minutesUntilNext / 60),
          indicator: '⏰'
        },
        lastUpdate: lastUpdateInfo,
        schedule: scheduleWithStatus,
        summary: {
          totalScheduled: updateSchedule.length,
          completed: recentUpdates,
          missed: missedUpdates,
          pending: scheduleWithStatus.filter(s => s.status === 'pending').length
        }
      }
    });

  } catch (error) {
    console.error('❌ Error checking trends tracking status:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
