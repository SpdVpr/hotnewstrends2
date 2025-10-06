// Force create daily plan
async function forceCreatePlan() {
  try {
    console.log('🔧 Force creating daily plan...\n');
    
    // Call the cron endpoint with force
    const response = await fetch('https://hotnewstrends.com/api/automation/cron', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force: true })
    });
    
    console.log(`Status: ${response.status} ${response.statusText}\n`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Cron response:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Error:', errorText);
    }
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check daily plan again
    console.log('\n📅 Checking daily plan after cron...');
    const today = new Date().toISOString().split('T')[0];
    const planResponse = await fetch(`https://hotnewstrends.com/api/daily-plan?date=${today}`);
    
    if (planResponse.ok) {
      const planData = await planResponse.json();
      const plan = planData.data?.dailyPlan;
      
      if (plan) {
        console.log(`   Date: ${plan.date}`);
        console.log(`   Total jobs: ${plan.jobs?.length || 0}`);
        
        if (plan.jobs && plan.jobs.length > 0) {
          console.log(`\n   First 5 jobs:`);
          plan.jobs.slice(0, 5).forEach(job => {
            console.log(`      #${job.position}: "${job.trend?.title}" - ${job.status}`);
          });
        } else {
          console.log(`   ⚠️ No jobs in daily plan!`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

forceCreatePlan();

