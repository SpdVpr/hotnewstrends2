// Test Perplexity API directly
// Using built-in fetch in Node.js 18+

async function testPerplexityAPI() {
  const apiKey = process.env.PERPLEXITY_API_KEY || '';
  const baseUrl = 'https://api.perplexity.ai/chat/completions';

  try {
    console.log('🔑 Testing Perplexity API with key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NO API KEY');
    
    if (!apiKey) {
      console.error('❌ No API key provided. Set PERPLEXITY_API_KEY environment variable.');
      return;
    }

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: 'What are the latest developments in AI technology?'
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ API Response received');
    console.log('📝 Content:', data.choices[0]?.message?.content || 'No content');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPerplexityAPI();
