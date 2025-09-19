import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const pragueTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Prague"}));
    const currentHour = pragueTime.getHours();
    const currentMinute = pragueTime.getMinutes();
    
    // Test creating scheduled time like in the code
    const date = new Date().toISOString().split('T')[0];
    
    // Old way (UTC)
    const scheduledTimeUTC = new Date(date + 'T00:00:00.000Z');
    scheduledTimeUTC.setUTCHours(currentHour, 0, 0, 0);
    
    // New way (Prague time)
    const scheduledTimePrague = new Date(date + 'T00:00:00.000+01:00');
    scheduledTimePrague.setHours(currentHour, 0, 0, 0);
    
    return NextResponse.json({
      success: true,
      data: {
        now: now.toISOString(),
        pragueTime: pragueTime.toISOString(),
        currentHour,
        currentMinute,
        position: currentHour + 1,
        scheduledTimeUTC: scheduledTimeUTC.toISOString(),
        scheduledTimePrague: scheduledTimePrague.toISOString(),
        scheduledTimeUTCLocal: scheduledTimeUTC.toLocaleString(),
        scheduledTimePragueLocal: scheduledTimePrague.toLocaleString()
      }
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
