require('dotenv').config();

async function startXAutomation() {
  console.log('🐦 Starting X Automation Service...');

  try {
    // Import the service (this will initialize it)
    const { xAutomationService } = require('./src/lib/services/x-automation');

    // Check if X API is configured
    const testResult = await xAutomationService.testConnection();
    
    if (!testResult.success) {
      console.log('⚠️ X API not configured or connection failed:', testResult.error);
      console.log('🐦 X automation will not start automatically');
      return;
    }

    console.log('✅ X API connection successful');
    console.log(`📱 Connected as: @${testResult.user.username}`);

    // Start the automation service
    await xAutomationService.start();
    
    console.log('🚀 X automation service started successfully!');
    console.log('📊 Service will share articles every 6 hours (4 times per day)');
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down X automation service...');
      xAutomationService.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down X automation service...');
      xAutomationService.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start X automation:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  startXAutomation();
}

module.exports = { startXAutomation };
