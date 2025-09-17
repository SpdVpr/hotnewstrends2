// Debug script to check if sources are being added
// Using built-in fetch

async function checkLatestArticle() {
  try {
    console.log('🔍 Fetching latest articles...');
    const response = await fetch('http://localhost:3002/api/articles');
    const data = await response.json();
    
    if (data.success && data.data.articles.length > 0) {
      const latest = data.data.articles[0];
      console.log(`📰 Latest article: ${latest.id}`);
      console.log(`📰 Title: ${latest.title}`);
      console.log(`📰 Created: ${latest.createdAt}`);
      
      // Fetch full article content
      console.log('\n🔍 Fetching full article content...');
      const articleResponse = await fetch(`http://localhost:3002/api/articles/${latest.id}`);
      const articleData = await articleResponse.json();
      
      if (articleData.success) {
        const content = articleData.data.content;
        console.log(`📝 Content length: ${content.length} characters`);
        
        // Check for Sources section
        if (content.includes('Sources:') || content.includes('## Sources')) {
          console.log('✅ SOURCES SECTION FOUND!');
          
          // Extract sources section
          const lines = content.split('\n');
          const sourcesIndex = lines.findIndex(line => 
            line.includes('Sources:') || line.includes('## Sources')
          );
          
          if (sourcesIndex !== -1) {
            console.log('\n📚 Sources section:');
            lines.slice(sourcesIndex, sourcesIndex + 10).forEach((line, i) => {
              console.log(`${sourcesIndex + i + 1}: ${line}`);
            });
          }
        } else {
          console.log('❌ NO SOURCES SECTION FOUND');
          console.log('\n📝 Last 10 lines of content:');
          const lines = content.split('\n');
          lines.slice(-10).forEach((line, i) => {
            console.log(`${lines.length - 10 + i + 1}: ${line}`);
          });
        }
        
        // Check for tags section
        if (content.includes('Tags:') || content.includes('## Tags')) {
          console.log('\n🏷️ TAGS SECTION FOUND!');
        } else {
          console.log('\n❌ NO TAGS SECTION FOUND');
        }
        
      } else {
        console.error('❌ Failed to fetch article content:', articleData.message);
      }
      
    } else {
      console.error('❌ No articles found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkLatestArticle();
