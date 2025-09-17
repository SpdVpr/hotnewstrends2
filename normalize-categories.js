// Normalize article categories
async function normalizeCategories() {
  try {
    console.log('🔧 Normalizing article categories...');
    
    // First dry run
    const dryRunResponse = await fetch('http://localhost:3002/api/articles/normalize-categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dryRun: true })
    });

    if (dryRunResponse.ok) {
      const dryRunData = await dryRunResponse.json();
      console.log('📊 Dry run results:');
      console.log(JSON.stringify(dryRunData, null, 2));
      
      // Now execute the actual normalization
      console.log('\n🚀 Executing normalization...');
      const executeResponse = await fetch('http://localhost:3002/api/articles/normalize-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dryRun: false })
      });

      if (executeResponse.ok) {
        const executeData = await executeResponse.json();
        console.log('✅ Normalization completed:');
        console.log(JSON.stringify(executeData, null, 2));
      } else {
        const errorText = await executeResponse.text();
        console.error('❌ Failed to execute normalization:', errorText);
      }
    } else {
      const errorText = await dryRunResponse.text();
      console.error('❌ Failed dry run:', errorText);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

normalizeCategories();
