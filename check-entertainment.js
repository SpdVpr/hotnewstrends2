// Using built-in fetch in Node.js 18+

async function checkEntertainmentArticles() {
  try {
    console.log('🔍 Checking for Entertainment articles...');
    
    const response = await fetch('http://localhost:3001/api/articles?category=entertainment&limit=50');
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Raw response:', JSON.stringify(data, null, 2));

      const articles = data.data?.articles || data.data || [];
      console.log('📊 Entertainment articles found:', articles.length);

      if (articles.length > 0) {
        console.log('📝 Sample Entertainment articles:');
        articles.slice(0, 5).forEach((article, index) => {
          console.log(`${index + 1}. ${article.title}`);
          console.log(`   Category: ${JSON.stringify(article.category)}`);
          console.log(`   Status: ${article.status}`);
          console.log('');
        });
      } else {
        console.log('❌ No Entertainment articles found');
      }
    } else {
      console.error('❌ Failed to fetch articles:', response.status);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkEntertainmentArticles();
