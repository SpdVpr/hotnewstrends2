// Test reset plan endpoint
async function testResetPlan() {
  try {
    console.log('🔄 Resetting daily plan...\n');
    
    const response = await fetch('https://hotnewstrends.com/api/debug/reset-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}\n`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Response:', JSON.stringify(data, null, 2));
      
      // Now trigger cron to process current hour
      console.log('\n🔄 Triggering cron job...');
      const cronResponse = await fetch('https://hotnewstrends.com/api/automation/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true })
      });
      
      if (cronResponse.ok) {
        const cronData = await cronResponse.json();
        console.log('✅ Cron response:', JSON.stringify(cronData, null, 2));
      }
      
    } else {
      const errorText = await response.text();
      console.log('❌ Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testResetPlan();

