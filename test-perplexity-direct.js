// Direct test of Perplexity API to debug citations issue
// Using built-in fetch (Node.js 18+)

async function testPerplexityAPI() {
  const apiKey = process.env.PERPLEXITY_API_KEY || '';
  const baseUrl = 'https://api.perplexity.ai/chat/completions';

  console.log('🔑 API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NO API KEY');
  console.log('🌐 Base URL:', baseUrl);

  const requestBody = {
    model: 'sonar-pro',
    messages: [
      {
        role: 'system',
        content: 'You are a journalist with web search capabilities. SEARCH THE WEB for current, factual information and write a news article based on real sources.\n\nFormat:\n[Headline]\n[Article content]\nCATEGORY: [Technology/Entertainment/News/Business/Sports/Health/Science]\n\nIMPORTANT: Choose the CORRECT category based on the topic:\n- Sports personalities, athletes, ESPN hosts → Sports\n- Celebrities, actors, musicians, TV shows → Entertainment\n- Tech companies, apps, AI, gadgets → Technology\n- Business news, stocks, companies → Business\n- Political news, government → News\n- Medical, fitness, wellness → Health\n- Research, discoveries, studies → Science\n\nCRITICAL: CREATE A UNIQUE, COMPELLING HEADLINE\n- Your headline must be UNIQUE and ATTENTION-GRABBING like a professional journalist\n- NEVER use generic formats like "Complete Guide" or "Everything You Need to Know"\n- Use power words: "Exposed", "Revealed", "Shocking", "Breaking", "Exclusive", "Inside", "Secret", "Controversial"\n- Make it specific to the actual news/topic, not generic'
      },
      {
        role: 'user',
        content: 'Search the web for the latest news about molly qerim. Find current information and write a comprehensive news article based on real sources you find online.'
      }
    ],
    max_tokens: 1000,
    temperature: 0.1,
    return_citations: true,
    return_related_questions: true
  };

  console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Full API response:');
      console.log(JSON.stringify(data, null, 2));
      
      console.log('\n🔍 ANALYSIS:');
      console.log('- Citations:', data.citations ? data.citations.length : 'NONE');
      console.log('- Search results:', data.search_results ? data.search_results.length : 'NONE');
      console.log('- Content length:', data.choices?.[0]?.message?.content?.length || 0);
      
      if (data.citations && data.citations.length > 0) {
        console.log('\n📚 CITATIONS FOUND:');
        data.citations.forEach((citation, i) => {
          console.log(`${i + 1}. ${citation}`);
        });
      }
      
      if (data.search_results && data.search_results.length > 0) {
        console.log('\n🔍 SEARCH RESULTS FOUND:');
        data.search_results.forEach((result, i) => {
          console.log(`${i + 1}. ${result.title} - ${result.url}`);
        });
      }
      
    } else {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.error('❌ Stack:', error.stack);
  }
}

testPerplexityAPI();
