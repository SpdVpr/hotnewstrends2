/**
 * Test Firebase trends access directly
 */

async function testFirebaseTrends() {
  console.log('🧪 Testing Firebase trends access...');
  
  try {
    // Test direct API call to get trends needing articles
    console.log('\n1. Testing Firebase trends API...');
    
    // We need to make a request that would trigger the Firebase trends service
    // Let's try to get trends that need articles
    const response = await fetch('http://localhost:3001/api/trends?source=firebase&limit=10');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Firebase trends API response:', {
        success: data.success,
        totalTopics: data.data.topics.length,
        source: data.data.source
      });
      
      if (data.data.topics.length > 0) {
        console.log('📊 Sample trends:');
        data.data.topics.slice(0, 3).forEach((trend, i) => {
          console.log(`  ${i + 1}. "${trend.title}" - ${trend.category} - ${trend.traffic || trend.searchVolume}`);
        });
      }
    } else {
      console.log('❌ Firebase trends API failed:', response.status);
    }

    // Test 2: Try to manually create a simple daily plan
    console.log('\n2. Testing manual daily plan creation...');
    
    // Create a simple test request to refresh daily plan
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
      console.log('❌ Daily plan refresh failed:', refreshResponse.status);
      console.log('Error details:', errorText);
    }

    // Test 3: Check if daily plan was created
    console.log('\n3. Checking daily plan after refresh...');
    const checkResponse = await fetch('http://localhost:3001/api/daily-plan');
    if (checkResponse.ok) {
      const checkData = await checkResponse.json();
      console.log('📊 Daily plan after refresh:', {
        totalJobs: checkData.data.stats.totalJobs,
        pendingJobs: checkData.data.stats.pendingJobs,
        hasDailyPlan: !!checkData.data.dailyPlan
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFirebaseTrends().catch(console.error);
