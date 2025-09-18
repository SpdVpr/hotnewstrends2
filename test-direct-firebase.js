/**
 * Test Firebase trends service directly
 */

// Import Firebase trends service directly
const { firebaseTrendsService } = require('./src/lib/services/firebase-trends.ts');

async function testDirectFirebase() {
  console.log('🧪 Testing Firebase trends service directly...');
  
  try {
    console.log('\n1. Testing getTrendsNeedingArticles...');
    
    const trends = await firebaseTrendsService.getTrendsNeedingArticles(10);
    console.log(`📊 Retrieved ${trends.length} trends needing articles`);
    
    if (trends.length > 0) {
      console.log('📊 Sample trends:');
      trends.slice(0, 3).forEach((trend, i) => {
        console.log(`  ${i + 1}. "${trend.title}" - ${trend.category} - ${trend.searchVolume}`);
      });
    } else {
      console.log('⚠️ No trends found that need articles');
    }

    console.log('\n2. Testing getTrendsStats...');
    const stats = await firebaseTrendsService.getTrendsStats();
    console.log('📊 Trends stats:', stats);

  } catch (error) {
    console.error('❌ Direct Firebase test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testDirectFirebase().catch(console.error);
