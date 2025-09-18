/**
 * Fix trends and populate trend tracker
 */

async function fixTrends() {
  console.log('🔧 Fixing trends system...');
  
  try {
    // First, get fresh trends from API
    console.log('\n1. Fetching fresh trends...');
    const trendsResponse = await fetch('http://localhost:3001/api/trends');
    if (!trendsResponse.ok) {
      console.log('❌ Failed to fetch trends:', trendsResponse.status);
      return;
    }

    const trendsData = await trendsResponse.json();
    console.log(`✅ Fetched ${trendsData.data.topics.length} trends`);
    console.log(`📊 Sample trends: ${trendsData.data.topics.slice(0, 5).map(t => t.title).join(', ')}`);

    // Now force process these trends to populate trend tracker
    console.log('\n2. Processing trends to populate trend tracker...');
    const processResponse = await fetch('http://localhost:3001/api/trends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topics: trendsData.data.topics,
        source: 'manual_fix'
      })
    });

    if (processResponse.ok) {
      const processData = await processResponse.json();
      console.log('✅ Trends processed successfully');
      console.log('📊 Processing result:', processData);
    } else {
      console.log('❌ Failed to process trends:', processResponse.status);
    }

    // Check trend tracking status
    console.log('\n3. Checking trend tracking status...');
    const trackingResponse = await fetch('http://localhost:3001/api/trend-tracking');
    if (trackingResponse.ok) {
      const trackingData = await trackingResponse.json();
      console.log('✅ Trend tracking status:', {
        totalTrends: trackingData.data.stats.totalTrends,
        newTrends: trackingData.data.stats.newTrends,
        lastUpdate: trackingData.data.stats.lastUpdate
      });
    }

    // Now refresh daily plan with populated trends
    console.log('\n4. Refreshing daily plan with populated trends...');
    const refreshResponse = await fetch('http://localhost:3001/api/daily-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'refresh' })
    });
    
    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      console.log('✅ Daily plan refreshed:', refreshData.message);
    } else {
      console.log('❌ Daily plan refresh failed:', refreshResponse.status);
    }

    // Check final status
    console.log('\n5. Final status check...');
    const finalStatusResponse = await fetch('http://localhost:3001/api/daily-plan');
    if (finalStatusResponse.ok) {
      const finalStatusData = await finalStatusResponse.json();
      console.log('📊 Final daily plan status:', {
        totalJobs: finalStatusData.data.stats.totalJobs,
        pendingJobs: finalStatusData.data.stats.pendingJobs,
        hasDailyPlan: !!finalStatusData.data.dailyPlan
      });

      if (finalStatusData.data.stats.totalJobs > 0) {
        console.log(`🎉 SUCCESS: Daily plan now has ${finalStatusData.data.stats.totalJobs} jobs!`);
        
        // Enable test mode for faster generation
        console.log('\n6. Enabling test mode...');
        const testModeResponse = await fetch('http://localhost:3001/api/daily-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'test-mode' })
        });
        
        if (testModeResponse.ok) {
          console.log('✅ Test mode enabled - articles will generate every 5 minutes');
        }
        
      } else {
        console.log('❌ Still no jobs in daily plan - deeper investigation needed');
      }
    }

  } catch (error) {
    console.error('❌ Error fixing trends:', error.message);
  }
}

// Run the fix
fixTrends().catch(console.error);
