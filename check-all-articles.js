// Check all articles and their categories
async function checkAllArticles() {
  try {
    console.log('🔍 Checking all articles...');
    
    const response = await fetch('http://localhost:3002/api/articles?limit=100');
    
    if (response.ok) {
      const data = await response.json();
      const articles = data.data || [];
      
      console.log(`📊 Total articles found: ${articles.length}`);
      
      // Group by category
      const categoryStats = {};
      const entertainmentCandidates = [];
      
      articles.forEach(article => {
        let categoryName = 'Unknown';
        
        if (typeof article.category === 'object' && article.category?.name) {
          categoryName = article.category.name;
        } else if (typeof article.category === 'string') {
          categoryName = article.category;
        }
        
        categoryStats[categoryName] = (categoryStats[categoryName] || 0) + 1;
        
        // Look for entertainment candidates
        const title = article.title.toLowerCase();
        const content = (article.content || '').toLowerCase();
        
        if (title.includes('taylor swift') || 
            title.includes('celebrity') || 
            title.includes('movie') || 
            title.includes('netflix') || 
            title.includes('disney') || 
            title.includes('music') || 
            title.includes('hollywood') || 
            title.includes('oscar') || 
            title.includes('award') ||
            title.includes('concert') ||
            title.includes('album') ||
            title.includes('series') ||
            content.includes('entertainment') ||
            content.includes('celebrity') ||
            content.includes('movie') ||
            content.includes('film')) {
          entertainmentCandidates.push({
            id: article.id,
            title: article.title,
            currentCategory: categoryName
          });
        }
      });
      
      console.log('\n📈 Category distribution:');
      Object.entries(categoryStats).forEach(([category, count]) => {
        console.log(`  ${category}: ${count} articles`);
      });
      
      console.log(`\n🎭 Entertainment candidates found: ${entertainmentCandidates.length}`);
      entertainmentCandidates.slice(0, 10).forEach((article, index) => {
        console.log(`  ${index + 1}. "${article.title}" (currently: ${article.currentCategory})`);
      });
      
    } else {
      console.error('❌ Failed to fetch articles:', response.status);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAllArticles();
