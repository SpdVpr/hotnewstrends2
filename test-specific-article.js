// Test specific article by slug
async function testArticle() {
  const slug = 'abhishek-sharma-ignites-asia-cup-2025-inside-the-fiery-india-pakistan-showdown';
  
  console.log(`🔍 Testing article with slug: "${slug}"`);
  console.log(`🌐 URL: http://localhost:3000/article/${slug}`);
  
  try {
    // Test if article page loads
    const response = await fetch(`http://localhost:3000/article/${slug}`);
    
    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      console.log('✅ Article page loaded successfully!');
      const html = await response.text();

      // Check if it's the actual article or 404 page
      if (html.includes('Article Not Found') || html.includes('404')) {
        console.log('❌ Article returned 200 but shows 404 content');

        // Check if it contains the article title
        if (html.includes('Abhishek Sharma')) {
          console.log('⚠️ BUT article title found in HTML! Might be a rendering issue');
        }
      } else {
        console.log('✅ Article content loaded successfully');

        // Try to extract title from HTML
        const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/);
        if (titleMatch) {
          console.log(`📰 Article title: ${titleMatch[1].replace(/<[^>]*>/g, '').substring(0, 100)}`);
        }

        // Check if article content is present
        if (html.includes('Abhishek Sharma')) {
          console.log('✅ Article content confirmed in HTML');
        }
      }
    } else if (response.status === 404) {
      console.log('❌ Article not found (404)');
    } else {
      console.log(`⚠️ Unexpected status: ${response.status}`);
    }
    
    // Now let's check if the article exists in the API
    console.log('\n🔍 Checking if article exists in API...');
    const apiResponse = await fetch('http://localhost:3000/api/articles?limit=500&status=published');

    if (apiResponse.ok) {
      const data = await apiResponse.json();
      console.log('📦 API response structure:', Object.keys(data));

      // Handle different response structures
      let articles = [];
      if (Array.isArray(data.data)) {
        articles = data.data;
      } else if (data.data && Array.isArray(data.data.articles)) {
        articles = data.data.articles;
      } else if (Array.isArray(data)) {
        articles = data;
      }

      console.log(`📊 Total articles in API: ${articles.length}`);
      
      // Find article by slug
      const article = articles.find(a => a.slug === slug);
      
      if (article) {
        console.log('✅ Article found in API:', {
          id: article.id,
          title: article.title,
          slug: article.slug,
          status: article.status,
          category: article.category,
          publishedAt: article.publishedAt,
          createdAt: article.createdAt
        });
      } else {
        console.log('❌ Article NOT found in API');
        
        // Search for similar slugs
        const similarSlugs = articles.filter(a => 
          a.slug && a.slug.includes('abhishek')
        );
        
        if (similarSlugs.length > 0) {
          console.log('\n📋 Found similar slugs:');
          similarSlugs.forEach(a => {
            console.log(`  - ${a.slug}`);
            console.log(`    Title: ${a.title}`);
            console.log(`    Status: ${a.status}`);
          });
        } else {
          console.log('❌ No similar slugs found');
        }
      }
    } else {
      console.log('❌ Failed to fetch articles from API');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testArticle();

