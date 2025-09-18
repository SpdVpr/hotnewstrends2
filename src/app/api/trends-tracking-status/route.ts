import { NextRequest, NextResponse } from 'next/server';

// GET /api/trends-tracking-status - Detailed trends tracking with schedule and indicators
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Checking trends tracking status...');
    
    // Define the exact schedule (7 times daily)
    const updateSchedule = [
      { time: '07:00', description: 'First update (before first article at 08:00)' },
      { time: '09:20', description: 'Second update' },
      { time: '11:40', description: 'Third update' },
      { time: '14:00', description: 'Fourth update' },
      { time: '16:20', description: 'Fifth update' },
      { time: '18:40', description: 'Sixth update' },
      { time: '21:00', description: 'Last update (before final articles)' }
    ];
    
    // Get current time
    const now = new Date();
    const currentUTCTime = now.toISOString();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    // Prague time (UTC+1, UTC+2 in summer)
    const pragueTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Prague"}));
    const pragueHour = pragueTime.getHours();
    const pragueMinute = pragueTime.getMinutes();
    
    // Calculate next scheduled update
    let nextUpdate = null;
    let minutesUntilNext = null;
    
    for (const schedule of updateSchedule) {
      const [hours, minutes] = schedule.time.split(':').map(Number);
      const scheduleTimeMinutes = hours * 60 + minutes;
      
      if (scheduleTimeMinutes > currentTimeMinutes) {
        nextUpdate = schedule;
        minutesUntilNext = scheduleTimeMinutes - currentTimeMinutes;
        break;
      }
    }
    
    // If no update today, next is tomorrow at 07:00
    if (!nextUpdate) {
      nextUpdate = updateSchedule[0];
      minutesUntilNext = (24 * 60) - currentTimeMinutes + (7 * 60); // Until tomorrow 07:00
    }
    
    // Get latest trends from Firebase to check last update
    const { firebaseTrendsService } = await import('@/lib/services/firebase-trends');
    const latestTrends = await firebaseTrendsService.getLatestTrends(10);
    
    // Analyze last update time
    let lastUpdateInfo = null;
    if (latestTrends.length > 0) {
      const newestTrend = latestTrends[0];
      const lastUpdateTime = new Date(newestTrend.createdAt);
      const minutesSinceUpdate = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60));
      
      lastUpdateInfo = {
        timestamp: newestTrend.createdAt,
        minutesAgo: minutesSinceUpdate,
        hoursAgo: Math.floor(minutesSinceUpdate / 60),
        trend: {
          title: newestTrend.title,
          source: newestTrend.source,
          searchVolume: newestTrend.searchVolume
        }
      };
    }
    
    // Determine update status for each scheduled time
    const scheduleWithStatus = updateSchedule.map(schedule => {
      const [hours, minutes] = schedule.time.split(':').map(Number);
      const scheduleTimeMinutes = hours * 60 + minutes;

      // Calculate Prague time for this schedule
      const utcScheduleTime = new Date();
      utcScheduleTime.setUTCHours(hours, minutes, 0, 0);
      const pragueScheduleTime = new Date(utcScheduleTime.toLocaleString("en-US", {timeZone: "Europe/Prague"}));
      const pragueHours = pragueScheduleTime.getHours();
      const pragueMinutes = pragueScheduleTime.getMinutes();

      // Check if this update should have happened today
      const isPast = scheduleTimeMinutes < currentTimeMinutes;
      const isCurrent = Math.abs(scheduleTimeMinutes - currentTimeMinutes) <= 30; // Within 30 minutes
      const isNext = schedule === nextUpdate;

      // Determine status indicator
      let status = 'pending';
      let indicator = '⏳';
      let statusText = 'Pending';

      if (isPast) {
        // Check if update actually happened (within 2 hours of scheduled time)
        if (lastUpdateInfo) {
          const updateTime = new Date(lastUpdateInfo.timestamp);
          const updateHour = updateTime.getUTCHours();
          const updateMinute = updateTime.getUTCMinutes();
          const updateTimeMinutes = updateHour * 60 + updateMinute;

          // If last update was within 2 hours of this scheduled time
          const timeDiff = Math.abs(updateTimeMinutes - scheduleTimeMinutes);
          if (timeDiff <= 120) { // Within 2 hours
            status = 'completed';
            indicator = '✅';
            statusText = `Completed (${Math.floor(timeDiff)} min ${timeDiff > scheduleTimeMinutes ? 'late' : 'early'})`;
          } else {
            status = 'missed';
            indicator = '❌';
            statusText = 'Missed';
          }
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
        utcTime: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} UTC`,
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
          utc: currentUTCTime,
          utcFormatted: `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')} UTC`,
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
