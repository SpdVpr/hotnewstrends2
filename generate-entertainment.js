// Generate Entertainment articles
async function generateEntertainmentArticles() {
  const entertainmentTopics = [
    'Taylor Swift new album',
    'Marvel Avengers movie',
    'Netflix series premiere',
    'Oscar nominations 2024',
    'Celebrity wedding news',
    'Disney new movie release',
    'Music festival lineup',
    'Hollywood awards ceremony'
  ];

  for (const topic of entertainmentTopics) {
    try {
      console.log(`🎭 Generating article for: ${topic}`);
      
      const response = await fetch('http://localhost:3001/api/automation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic,
          category: 'Entertainment'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Generated: ${data.article?.title || 'Article'}`);
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to generate article for "${topic}":`, errorText);
      }
      
      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Error generating article for "${topic}":`, error.message);
    }
  }
}

generateEntertainmentArticles();
