// Direct test of Perplexity API to debug citations issue
// Using built-in fetch (Node.js 18+)

async function testPerplexityAPI() {
  const apiKey = process.env.PERPLEXITY_API_KEY || '';
  const baseUrl = 'https://api.perplexity.ai/chat/completions';

  console.log('🔑 API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NO API KEY');
  console.log('🌐 Base URL:', baseUrl);

  if (!apiKey) {
    console.error('❌ No API key provided. Set PERPLEXITY_API_KEY environment variable.');
    return;
  }

  try {
    console.log('\n📤 Making API request...');
    
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
            content: 'You are a professional journalist. Provide factual information with proper citations.'
          },
          {
            role: 'user',
            content: 'Write a brief article about recent developments in artificial intelligence. Include sources and citations.'
          }
        ],
        max_tokens: 800,
        temperature: 0.3,
        top_p: 0.9,
        return_citations: true,
        search_domain_filter: ["bbc.com", "cnn.com", "reuters.com", "techcrunch.com"],
        search_recency_filter: "day"
      })
    });

    console.log('📊 Response Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ API Response received successfully');
    
    const content = data.choices[0]?.message?.content || '';
    console.log('\n📝 Generated Content:');
    console.log('=' .repeat(50));
    console.log(content);
    console.log('=' .repeat(50));
    
    // Check for citations
    if (data.citations && data.citations.length > 0) {
      console.log('\n📚 Citations found:');
      data.citations.forEach((citation, index) => {
        console.log(`${index + 1}. ${citation}`);
      });
    } else {
      console.log('\n❌ No citations found in response');
    }
    
    // Check content for source indicators
    const hasSourceSection = content.includes('Sources:') || content.includes('References:');
    console.log(`\n🔍 Has source section: ${hasSourceSection ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

testPerplexityAPI();
