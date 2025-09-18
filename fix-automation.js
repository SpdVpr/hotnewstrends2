/**
 * Fix automation script - directly start automated article generator
 */

async function fixAutomation() {
  console.log('🔧 Fixing automation system...');
  
  try {
    // First, check current status
    console.log('\n1. Checking current daily plan status...');
    const statusResponse = await fetch('http://localhost:3001/api/daily-plan');
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('📊 Current status:', {
        isRunning: statusData.data.isRunning,
        totalJobs: statusData.data.stats.totalJobs,
        pendingJobs: statusData.data.stats.pendingJobs,
        hasDailyPlan: !!statusData.data.dailyPlan
      });
    }

    // Refresh daily plan to ensure we have jobs
    console.log('\n2. Refreshing daily plan...');
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
      return;
    }

    // Check status after refresh
    console.log('\n3. Checking status after refresh...');
    const statusAfterResponse = await fetch('http://localhost:3001/api/daily-plan');
    if (statusAfterResponse.ok) {
      const statusAfterData = await statusAfterResponse.json();
      console.log('📊 Status after refresh:', {
        isRunning: statusAfterData.data.isRunning,
        totalJobs: statusAfterData.data.stats.totalJobs,
        pendingJobs: statusAfterData.data.stats.pendingJobs,
        hasDailyPlan: !!statusAfterData.data.dailyPlan
      });

      if (statusAfterData.data.stats.totalJobs > 0) {
        console.log(`✅ Daily plan has ${statusAfterData.data.stats.totalJobs} jobs ready`);
      } else {
        console.log('⚠️ No jobs in daily plan - this might be the issue');
      }
    }

    // Try to enable test mode for faster generation
    console.log('\n4. Enabling test mode for faster generation...');
    const testModeResponse = await fetch('http://localhost:3001/api/daily-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test-mode' })
    });
    
    if (testModeResponse.ok) {
      const testModeData = await testModeResponse.json();
      console.log('✅ Test mode enabled:', testModeData.message);
    } else {
      console.log('⚠️ Test mode failed, continuing with normal mode');
    }

    // Try alternative automation start via different endpoint
    console.log('\n5. Attempting to start automation via generate endpoint...');
    const generateResponse = await fetch('http://localhost:3001/api/automation/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'start_automated_generation',
        testMode: true 
      })
    });
    
    if (generateResponse.ok) {
      const generateData = await generateResponse.json();
      console.log('✅ Automation started via generate endpoint:', generateData);
    } else {
      console.log('❌ Generate endpoint failed:', generateResponse.status);
    }

    // Final status check
    console.log('\n6. Final status check...');
    const finalStatusResponse = await fetch('http://localhost:3001/api/daily-plan');
    if (finalStatusResponse.ok) {
      const finalStatusData = await finalStatusResponse.json();
      console.log('📊 Final status:', {
        isRunning: finalStatusData.data.isRunning,
        totalJobs: finalStatusData.data.stats.totalJobs,
        pendingJobs: finalStatusData.data.stats.pendingJobs,
        generatingJobs: finalStatusData.data.stats.generatingJobs
      });

      if (finalStatusData.data.isRunning) {
        console.log('🎉 SUCCESS: Automation is now running!');
      } else {
        console.log('⚠️ Automation is still not running - manual intervention needed');
      }
    }

  } catch (error) {
    console.error('❌ Error fixing automation:', error.message);
  }
}

// Run the fix
fixAutomation().catch(console.error);
