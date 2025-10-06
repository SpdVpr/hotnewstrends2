// Check daily plan directly
async function checkDailyPlan() {
  try {
    console.log('📅 Checking daily plan...\n');
    
    const today = new Date().toISOString().split('T')[0];
    console.log(`Today's date: ${today}\n`);
    
    // Try to get daily plan via API
    const response = await fetch(`https://hotnewstrends.com/api/daily-plan?date=${today}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Daily plan response:', JSON.stringify(data, null, 2));
      
      if (data.data?.dailyPlan) {
        const plan = data.data.dailyPlan;
        console.log(`\n📊 Daily Plan Summary:`);
        console.log(`   Date: ${plan.date}`);
        console.log(`   Total jobs: ${plan.jobs?.length || 0}`);
        console.log(`   Created: ${plan.createdAt}`);
        console.log(`   Updated: ${plan.updatedAt}`);
        
        if (plan.jobs && plan.jobs.length > 0) {
          console.log(`\n📋 Jobs breakdown:`);
          const pending = plan.jobs.filter(j => j.status === 'pending').length;
          const generating = plan.jobs.filter(j => j.status === 'generating').length;
          const completed = plan.jobs.filter(j => j.status === 'completed').length;
          const failed = plan.jobs.filter(j => j.status === 'failed').length;
          
          console.log(`   Pending: ${pending}`);
          console.log(`   Generating: ${generating}`);
          console.log(`   Completed: ${completed}`);
          console.log(`   Failed: ${failed}`);
          
          console.log(`\n📝 First 3 jobs:`);
          plan.jobs.slice(0, 3).forEach(job => {
            console.log(`   #${job.position}: "${job.trend?.title}" - ${job.status} (scheduled: ${job.scheduledAt})`);
          });
        }
      } else {
        console.log('⚠️ No daily plan found in response');
      }
    } else {
      console.log(`❌ Failed to get daily plan: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`Error: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDailyPlan();

