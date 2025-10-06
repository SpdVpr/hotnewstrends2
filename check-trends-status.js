// Check trends status in Firebase
async function checkTrendsStatus() {
  try {
    console.log('🔍 Checking trends status in Firebase...\n');
    
    // Get all trends
    const response = await fetch('https://hotnewstrends.com/api/firebase-trends?limit=50');
    const data = await response.json();
    
    if (data.success && data.data?.trends) {
      const trends = data.data.trends;
      console.log(`📊 Total trends in Firebase: ${trends.length}\n`);
      
      // Count by articleGenerated status
      const withArticle = trends.filter(t => t.articleGenerated === true).length;
      const withoutArticle = trends.filter(t => t.articleGenerated === false).length;
      const undefinedCount = trends.filter(t => t.articleGenerated === undefined).length;
      
      console.log(`📈 Breakdown:`);
      console.log(`   ✅ With article (articleGenerated=true): ${withArticle}`);
      console.log(`   ❌ Without article (articleGenerated=false): ${withoutArticle}`);
      console.log(`   ⚠️  Undefined articleGenerated: ${undefinedCount}`);
      console.log('');
      
      // Show first 10 trends with their status
      console.log(`📋 First 10 trends:`);
      trends.slice(0, 10).forEach((trend, i) => {
        const status = trend.articleGenerated === true ? '✅' : 
                      trend.articleGenerated === false ? '❌' : '⚠️';
        console.log(`   ${i + 1}. ${status} "${trend.title}" (articleGenerated: ${trend.articleGenerated})`);
      });
      
      // Check if we need to reset articleGenerated flags
      if (withoutArticle === 0 && withArticle > 0) {
        console.log('\n⚠️  WARNING: All trends have articleGenerated=true!');
        console.log('   This is why no articles are being generated.');
        console.log('   You may need to reset some flags or import fresh trends.');
      }
      
    } else {
      console.log('❌ Failed to get trends:', data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTrendsStatus();

