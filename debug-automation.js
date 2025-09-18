/**
 * Debug script to diagnose automation issues
 */

async function debugAutomation() {
  console.log('🔍 Debugging automation system...');
  
  try {
    // Test basic server connection
    console.log('\n1. Testing server connection...');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    if (healthResponse.ok) {
      console.log('✅ Server is responding');
    } else {
      console.log('❌ Server health check failed:', healthResponse.status);
    }
  } catch (error) {
    console.log('❌ Server connection failed:', error.message);
    return;
  }

  try {
    // Test trends API
    console.log('\n2. Testing trends API...');
    const trendsResponse = await fetch('http://localhost:3001/api/trends');
    if (trendsResponse.ok) {
      const trendsData = await trendsResponse.json();
      console.log(`✅ Trends API working: ${trendsData.data.topics.length} trends loaded`);
      console.log(`📊 Sample trends: ${trendsData.data.topics.slice(0, 3).map(t => t.title).join(', ')}`);
    } else {
      console.log('❌ Trends API failed:', trendsResponse.status);
    }
  } catch (error) {
    console.log('❌ Trends API error:', error.message);
  }

  try {
    // Test daily plan API
    console.log('\n3. Testing daily plan API...');
    const dailyPlanResponse = await fetch('http://localhost:3001/api/daily-plan');
    if (dailyPlanResponse.ok) {
      const dailyPlanData = await dailyPlanResponse.json();
      console.log('✅ Daily plan API working');
      console.log('📅 Daily plan status:', {
        isRunning: dailyPlanData.data.isRunning,
        totalJobs: dailyPlanData.data.stats.totalJobs,
        pendingJobs: dailyPlanData.data.stats.pendingJobs,
        hasDailyPlan: !!dailyPlanData.data.dailyPlan
      });
    } else {
      console.log('❌ Daily plan API failed:', dailyPlanResponse.status);
    }
  } catch (error) {
    console.log('❌ Daily plan API error:', error.message);
  }

  try {
    // Try to refresh daily plan
    console.log('\n4. Attempting to refresh daily plan...');
    const refreshResponse = await fetch('http://localhost:3001/api/daily-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'refresh' })
    });
    
    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      console.log('✅ Daily plan refresh successful:', refreshData.message);
    } else {
      const errorText = await refreshResponse.text();
      console.log('❌ Daily plan refresh failed:', refreshResponse.status, errorText);
    }
  } catch (error) {
    console.log('❌ Daily plan refresh error:', error.message);
  }

  try {
    // Check automation status
    console.log('\n5. Testing automation status...');
    const automationResponse = await fetch('http://localhost:3001/api/automation/status');
    if (automationResponse.ok) {
      const automationData = await automationResponse.json();
      console.log('✅ Automation status API working');
      console.log('🤖 Automation status:', {
        isRunning: automationData.data.isRunning,
        todayJobs: automationData.data.todayJobs,
        totalJobs: automationData.data.totalJobs
      });
    } else {
      console.log('❌ Automation status API failed:', automationResponse.status);
    }
  } catch (error) {
    console.log('❌ Automation status error:', error.message);
  }

  console.log('\n🔍 Debug complete. Check the results above for issues.');
}

// Run the debug
debugAutomation().catch(console.error);
