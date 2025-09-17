// Test article generation API directly
async function testGenerateArticle() {
  try {
    console.log('🚀 Testing article generation API...');
    
    const response = await fetch('http://localhost:3002/api/automation/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: 'robert redford',
        category: 'Entertainment'
      })
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! Response data:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
    }

  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

testGenerateArticle();
