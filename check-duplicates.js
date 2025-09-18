/**
 * Check for duplicates in daily plan
 */

async function checkDuplicates() {
  console.log('🔍 Checking for duplicates in daily plan...');
  
  try {
    const response = await fetch('http://localhost:3001/api/daily-plan');
    const data = await response.json();
    
    if (!data.success || !data.data.dailyPlan) {
      console.log('❌ No daily plan found');
      return;
    }
    
    const jobs = data.data.dailyPlan.jobs;
    console.log(`📊 Total jobs: ${jobs.length}`);
    
    // Extract titles
    const titles = jobs.map(job => job.trend.title);
    const uniqueTitles = [...new Set(titles)];
    
    console.log(`📊 Unique titles: ${uniqueTitles.length}`);
    console.log(`📊 Duplicates found: ${titles.length - uniqueTitles.length}`);
    
    if (titles.length !== uniqueTitles.length) {
      console.log('\n🔄 Duplicate trends found:');
      
      const titleCounts = {};
      titles.forEach(title => {
        titleCounts[title] = (titleCounts[title] || 0) + 1;
      });
      
      Object.entries(titleCounts)
        .filter(([title, count]) => count > 1)
        .forEach(([title, count]) => {
          console.log(`  "${title}" appears ${count} times`);
        });
    } else {
      console.log('✅ No duplicates found - all trends are unique!');
    }
    
    console.log('\n📋 All trends in daily plan:');
    uniqueTitles.forEach((title, i) => {
      console.log(`  ${i + 1}. "${title}"`);
    });
    
  } catch (error) {
    console.error('❌ Error checking duplicates:', error.message);
  }
}

// Run the check
checkDuplicates().catch(console.error);
