// Test automation endpoints
async function testAutomation() {
  try {
    console.log('🧪 Testing automation system...\n');
    
    // 1. Check Firebase trends
    console.log('1️⃣ Checking Firebase trends...');
    const trendsResponse = await fetch('https://hotnewstrends.com/api/firebase-trends?limit=10');
    const trendsData = await trendsResponse.json();
    console.log(`   ✅ Firebase trends: ${trendsData.data?.trends?.length || 0} trends available`);
    if (trendsData.data?.trends?.length > 0) {
      console.log(`   📊 First trend: "${trendsData.data.trends[0].title}"`);
    }
    console.log('');
    
    // 2. Check automation stats
    console.log('2️⃣ Checking automation stats...');
    const statsResponse = await fetch('https://hotnewstrends.com/api/automation/stats');
    const statsData = await statsResponse.json();
    console.log(`   📈 Stats:`, JSON.stringify(statsData.data, null, 2));
    console.log('');
    
    // 3. Try to trigger cron job
    console.log('3️⃣ Triggering cron job (force)...');
    const cronResponse = await fetch('https://hotnewstrends.com/api/automation/cron', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force: true })
    });
    
    console.log(`   Status: ${cronResponse.status} ${cronResponse.statusText}`);
    
    if (cronResponse.ok) {
      const cronData = await cronResponse.json();
      console.log(`   ✅ Cron response:`, JSON.stringify(cronData, null, 2));
    } else {
      const errorText = await cronResponse.text();
      console.log(`   ❌ Cron error:`, errorText);
    }
    console.log('');
    
    // 4. Check stats again
    console.log('4️⃣ Checking automation stats after cron...');
    const statsResponse2 = await fetch('https://hotnewstrends.com/api/automation/stats');
    const statsData2 = await statsResponse2.json();
    console.log(`   📈 Stats:`, JSON.stringify(statsData2.data, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAutomation();

