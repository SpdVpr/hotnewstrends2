// Test debug create plan endpoint
async function testDebugCreatePlan() {
  try {
    console.log('🔍 Testing debug create plan endpoint...\n');
    
    const response = await fetch('https://hotnewstrends.com/api/debug/create-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}\n`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Response:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDebugCreatePlan();

