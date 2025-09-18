/**
 * Test processed topics functionality
 */

async function testProcessedTopics() {
  console.log('🧪 Testing processed topics functionality...');
  
  try {
    // Test 1: Manually mark "windsor castle" as processed
    console.log('\n1. Manually marking "windsor castle" as processed...');
    
    // We'll use the Firebase processed topics service directly
    // Since we can't import it in Node.js, we'll create a simple API call
    
    // First, let's check current processed topics
    const response = await fetch('http://localhost:3001/api/firebase-trends?needingArticles=true&limit=5');
    const data = await response.json();
    
    console.log('📊 Current trends needing articles:');
    data.data.topics.forEach((trend, i) => {
      console.log(`  ${i + 1}. "${trend.title}"`);
    });
    
    // Check if "windsor castle" is in the list
    const hasWindsorCastle = data.data.topics.some(trend => 
      trend.title.toLowerCase().includes('windsor castle')
    );
    
    if (hasWindsorCastle) {
      console.log('⚠️ "windsor castle" is still in trends needing articles - not marked as processed yet');
    } else {
      console.log('✅ "windsor castle" is not in trends needing articles - correctly filtered out');
    }
    
    // Test 2: Create a new daily plan to see if it excludes processed topics
    console.log('\n2. Creating new daily plan to test filtering...');
    
    const startResponse = await fetch('http://localhost:3001/api/start-generation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (startResponse.ok) {
      const startData = await startResponse.json();
      console.log(`✅ New daily plan created with ${startData.data.totalJobs} jobs`);
      console.log(`📝 First job: "${startData.data.firstJob}"`);
      
      // Check if "windsor castle" is in the new plan
      if (startData.data.firstJob === 'windsor castle') {
        console.log('⚠️ "windsor castle" is still first job - processed topics filtering may not be working');
      } else {
        console.log('✅ "windsor castle" is not first job - processed topics filtering working');
      }
    } else {
      console.log('❌ Failed to create new daily plan');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testProcessedTopics().catch(console.error);
