// Test Perplexity API directly
// Using built-in fetch in Node.js 18+

async function testPerplexityAPI() {
  const apiKey = process.env.PERPLEXITY_API_KEY || '';
  const baseUrl = 'https://api.perplexity.ai/chat/completions';

  try {
    console.log('🔑 Testing Perplexity API with key:', apiKey.substring(0, 10) + '...');
    
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'user',
            content: 'What is the latest news about Robert Redford today? Search for current information.'
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
        return_citations: true,
        search_recency_filter: "day"
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

testPerplexityAPI();
