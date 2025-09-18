/**
 * Test daily plan creation with Firebase trends
 */

async function testDailyPlan() {
  console.log('🧪 Testing daily plan creation...');
  
  try {
    // Test 1: Check current daily plan status
    console.log('\n1. Checking current daily plan status...');
    const statusResponse = await fetch('http://localhost:3001/api/daily-plan');
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('📊 Current daily plan status:', {
        isRunning: statusData.data.isRunning,
        totalJobs: statusData.data.stats.totalJobs,
        pendingJobs: statusData.data.stats.pendingJobs,
        hasDailyPlan: !!statusData.data.dailyPlan
      });
    } else {
      console.log('❌ Failed to get daily plan status:', statusResponse.status);
    }

    // Test 2: Check Firebase trends directly
    console.log('\n2. Checking Firebase trends...');
    const trendsResponse = await fetch('http://localhost:3001/api/trends/scheduler');
    if (trendsResponse.ok) {
      const trendsData = await trendsResponse.json();
      console.log('📊 Firebase trends stats:', {
        total: trendsData.data.trends.total,
        needingArticles: trendsData.data.trends.needingArticles,
        articlesGenerated: trendsData.data.trends.articlesGenerated
      });
      
      if (trendsData.data.trends.needingArticles > 0) {
        console.log('✅ Firebase has trends that need articles - daily plan should work');
      } else {
        console.log('⚠️ No trends need articles - this might be the issue');
      }
    } else {
      console.log('❌ Failed to get trends stats:', trendsResponse.status);
    }

    // Test 3: Try to enable test mode (this might work even if refresh fails)
    console.log('\n3. Attempting to enable test mode...');
    try {
      const testModeResponse = await fetch('http://localhost:3001/api/daily-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-mode' })
      });
      
      if (testModeResponse.ok) {
        const testModeData = await testModeResponse.json();
        console.log('✅ Test mode response:', testModeData.message);
      } else {
        const errorText = await testModeResponse.text();
        console.log('❌ Test mode failed:', testModeResponse.status, errorText);
      }
    } catch (testError) {
      console.log('❌ Test mode error:', testError.message);
    }

    // Test 4: Check final status after test mode
    console.log('\n4. Final status check...');
    const finalResponse = await fetch('http://localhost:3001/api/daily-plan');
    if (finalResponse.ok) {
      const finalData = await finalResponse.json();
      console.log('📊 Final status:', {
        isRunning: finalData.data.isRunning,
        totalJobs: finalData.data.stats.totalJobs,
        pendingJobs: finalData.data.stats.pendingJobs,
        generatingJobs: finalData.data.stats.generatingJobs
      });

      if (finalData.data.stats.totalJobs > 0) {
        console.log('🎉 SUCCESS: Daily plan has jobs!');
        
        if (finalData.data.isRunning) {
          console.log('🚀 Automation is running - articles should start generating');
        } else {
          console.log('⚠️ Automation not running - may need manual start');
        }
      } else {
        console.log('❌ Still no jobs in daily plan');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDailyPlan().catch(console.error);
