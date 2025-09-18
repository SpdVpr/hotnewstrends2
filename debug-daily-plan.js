/**
 * Debug daily plan refresh
 */

async function debugDailyPlan() {
  console.log('🧪 Debugging daily plan refresh...');
  
  try {
    console.log('\n1. Testing daily plan refresh...');
    
    const response = await fetch('http://localhost:3001/api/daily-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'refresh' })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('❌ Parsed error:', errorJson);
      } catch (parseError) {
        console.log('❌ Could not parse error as JSON');
      }
    }

    // Check final status
    console.log('\n2. Checking final daily plan status...');
    const statusResponse = await fetch('http://localhost:3001/api/daily-plan');
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('📊 Final status:', {
        totalJobs: statusData.data.stats.totalJobs,
        pendingJobs: statusData.data.stats.pendingJobs,
        isRunning: statusData.data.isRunning
      });
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugDailyPlan().catch(console.error);
