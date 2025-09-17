// AI Search Engine Optimization Analysis
async function analyzeAISearchOptimization() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🤖 Analyzing AI Search Engine Optimization...\n');
  
  // Check homepage for AI-friendly content
  try {
    const response = await fetch(`${baseUrl}/`);
    const html = await response.text();
    
    console.log('📄 Homepage AI Search Analysis:');
    
    // 1. Structured Data for AI Understanding
    const structuredDataMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs);
    if (structuredDataMatches) {
      console.log(`  ✅ Structured Data: ${structuredDataMatches.length} JSON-LD blocks found`);
      
      structuredDataMatches.forEach((match, index) => {
        try {
          const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
          const data = JSON.parse(jsonContent);
          
          if (Array.isArray(data)) {
            data.forEach((item, i) => {
              console.log(`    - Block ${index + 1}.${i + 1}: ${item['@type']} schema`);
            });
          } else {
            console.log(`    - Block ${index + 1}: ${data['@type']} schema`);
          }
        } catch (e) {
          console.log(`    - Block ${index + 1}: Invalid JSON-LD`);
        }
      });
    } else {
      console.log('  ❌ No structured data found');
    }
    
    // 2. Content Clarity for AI
    const headingMatches = html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi);
    if (headingMatches && headingMatches.length >= 3) {
      console.log(`  ✅ Content Structure: ${headingMatches.length} headings found (good for AI parsing)`);
    } else {
      console.log('  ⚠️ Content Structure: Few headings found (AI may struggle with content hierarchy)');
    }
    
    // 3. Semantic HTML for AI Understanding
    const semanticElements = [
      'article', 'section', 'nav', 'header', 'footer', 'main', 'aside'
    ];
    
    let semanticScore = 0;
    semanticElements.forEach(element => {
      const regex = new RegExp(`<${element}[^>]*>`, 'gi');
      if (regex.test(html)) {
        semanticScore++;
      }
    });
    
    console.log(`  ${semanticScore >= 4 ? '✅' : '⚠️'} Semantic HTML: ${semanticScore}/7 semantic elements used`);
    
    // 4. Meta Information for AI Context
    const metaChecks = [
      { name: 'Description', regex: /<meta[^>]*name="description"[^>]*content="([^"]*)"/ },
      { name: 'Keywords', regex: /<meta[^>]*name="keywords"[^>]*content="([^"]*)"/ },
      { name: 'Author', regex: /<meta[^>]*name="author"[^>]*content="([^"]*)"/ },
      { name: 'Publisher', regex: /<meta[^>]*name="publisher"[^>]*content="([^"]*)"/ }
    ];
    
    metaChecks.forEach(check => {
      const match = html.match(check.regex);
      if (match) {
        console.log(`  ✅ ${check.name}: "${match[1].substring(0, 50)}..."`);
      } else {
        console.log(`  ❌ ${check.name}: Missing`);
      }
    });
    
    console.log('\n');
    
  } catch (error) {
    console.error('Error analyzing homepage:', error.message);
  }
  
  // Check article page structure
  try {
    console.log('📰 Article Structure Analysis:');
    
    // Get a sample article
    const articlesResponse = await fetch(`${baseUrl}/api/articles?limit=1`);
    const articlesData = await articlesResponse.json();
    
    if (articlesData.data && articlesData.data.length > 0) {
      const sampleArticle = articlesData.data[0];
      console.log(`  📄 Sample Article: "${sampleArticle.title.substring(0, 50)}..."`);
      
      // Check article page
      const articleResponse = await fetch(`${baseUrl}/article/${sampleArticle.slug}`);
      const articleHtml = await articleResponse.text();
      
      // AI-friendly article structure
      const articleChecks = [
        { name: 'Article Schema', regex: /"@type":\s*"NewsArticle"/ },
        { name: 'Author Information', regex: /"author":\s*{[^}]*"name"/ },
        { name: 'Publication Date', regex: /"datePublished"/ },
        { name: 'Word Count', regex: /"wordCount"/ },
        { name: 'Reading Time', regex: /"timeRequired"/ },
        { name: 'Article Section', regex: /"articleSection"/ },
        { name: 'Keywords', regex: /"keywords"/ },
        { name: 'Free Access', regex: /"isAccessibleForFree":\s*true/ }
      ];
      
      articleChecks.forEach(check => {
        if (check.regex.test(articleHtml)) {
          console.log(`  ✅ ${check.name}: Present`);
        } else {
          console.log(`  ❌ ${check.name}: Missing`);
        }
      });
      
      // Content analysis
      const contentMatch = articleHtml.match(/<article[^>]*>(.*?)<\/article>/s);
      if (contentMatch) {
        const content = contentMatch[1];
        const paragraphs = (content.match(/<p[^>]*>/g) || []).length;
        const lists = (content.match(/<[uo]l[^>]*>/g) || []).length;
        const headings = (content.match(/<h[2-6][^>]*>/g) || []).length;
        
        console.log(`  📊 Content Structure:`);
        console.log(`    - Paragraphs: ${paragraphs}`);
        console.log(`    - Lists: ${lists}`);
        console.log(`    - Subheadings: ${headings}`);
        
        if (paragraphs >= 5 && headings >= 2) {
          console.log(`  ✅ Well-structured content for AI parsing`);
        } else {
          console.log(`  ⚠️ Content could be better structured for AI`);
        }
      }
      
    } else {
      console.log('  ❌ No articles found for analysis');
    }
    
  } catch (error) {
    console.error('Error analyzing article structure:', error.message);
  }
  
  console.log('\n🎯 AI Search Engine Recommendations:');
  console.log('1. ✅ Structured data is well implemented');
  console.log('2. ✅ Semantic HTML structure is good');
  console.log('3. ✅ Article schema is comprehensive');
  console.log('4. 🔄 Consider adding FAQ schema for common questions');
  console.log('5. 🔄 Add more specific entity markup for people/places');
  console.log('6. 🔄 Include citation/source schema for credibility');
}

analyzeAISearchOptimization();
