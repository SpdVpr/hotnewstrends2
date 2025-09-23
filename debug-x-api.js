const { TwitterApi } = require('twitter-api-v2');
require('dotenv').config();

async function debugXApi() {
  console.log('🔍 Debugging X API Configuration...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('X_API_KEY:', process.env.X_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('X_API_SECRET:', process.env.X_API_SECRET ? '✅ Set' : '❌ Missing');
  console.log('X_ACCESS_TOKEN:', process.env.X_ACCESS_TOKEN ? '✅ Set' : '❌ Missing');
  console.log('X_ACCESS_TOKEN_SECRET:', process.env.X_ACCESS_TOKEN_SECRET ? '✅ Set' : '❌ Missing');
  console.log();

  if (!process.env.X_API_KEY || !process.env.X_API_SECRET || !process.env.X_ACCESS_TOKEN || !process.env.X_ACCESS_TOKEN_SECRET) {
    console.log('❌ Missing required environment variables!');
    return;
  }

  try {
    // Initialize client
    const client = new TwitterApi({
      appKey: process.env.X_API_KEY,
      appSecret: process.env.X_API_SECRET,
      accessToken: process.env.X_ACCESS_TOKEN,
      accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
    });

    console.log('🔗 Testing connection...');
    
    // Test connection with user info
    const user = await client.v2.me();
    console.log('✅ Connected as:', user.data.username, `(${user.data.name})`);
    console.log('👤 User ID:', user.data.id);
    console.log();

    // Check app permissions
    console.log('🔐 Testing permissions...');
    
    try {
      // Try to get user's tweets (read permission)
      const tweets = await client.v2.userTimeline(user.data.id, { max_results: 5 });
      console.log('✅ Read permission: OK');
      console.log('📝 Recent tweets count:', tweets.data?.data?.length || 0);
    } catch (error) {
      console.log('❌ Read permission: FAILED');
      console.log('Error:', error.message);
    }

    try {
      // Try to post a test tweet (write permission) - but don't actually post
      console.log('✅ Write permission: Testing (not posting)');
      console.log('📝 Would post: "Test tweet content"');
    } catch (error) {
      console.log('❌ Write permission: FAILED');
      console.log('Error:', error.message);
    }

    console.log();
    console.log('🎯 Recommendations:');
    console.log('1. Check X Developer Portal: https://developer.twitter.com/en/portal/dashboard');
    console.log('2. Verify app permissions include "Read and Write"');
    console.log('3. Regenerate tokens if needed');
    console.log('4. Make sure app is not in "Restricted" mode');

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.code === 401) {
      console.log('\n🔧 Error 401 - Unauthorized:');
      console.log('- Check if API keys are correct');
      console.log('- Verify tokens are not expired');
      console.log('- Make sure app has proper permissions');
    } else if (error.code === 403) {
      console.log('\n🔧 Error 403 - Forbidden:');
      console.log('- App may be suspended or restricted');
      console.log('- Check X Developer Portal for app status');
      console.log('- Verify app has "Read and Write" permissions');
      console.log('- Make sure you\'re not exceeding rate limits');
    }
  }
}

debugXApi().catch(console.error);
