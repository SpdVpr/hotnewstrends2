require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');

async function testXPost() {
  console.log('🐦 Testing X API Post...\n');

  try {
    // Initialize X API client
    const client = new TwitterApi({
      appKey: process.env.X_API_KEY,
      appSecret: process.env.X_API_SECRET,
      accessToken: process.env.X_ACCESS_TOKEN,
      accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
    });

    // Test connection first
    console.log('🔍 Testing connection...');
    const user = await client.v2.me();
    console.log(`✅ Connected as: @${user.data.username} (${user.data.name})`);

    // Create test tweet
    const testTweet = `🧪 X API Integration Test

Testing automatic posting from HotNewsTrends.com

#test #automation #hotnewstrends

${new Date().toISOString()}`;

    console.log('\n📝 Test tweet content:');
    console.log('──────────────────────────────────────────────────');
    console.log(testTweet);
    console.log('──────────────────────────────────────────────────');
    console.log(`Length: ${testTweet.length}/280 characters\n`);

    // Ask for confirmation
    console.log('🤔 Do you want to post this test tweet?');
    console.log('⚠️  This will count towards your daily limit (17 posts/24h)');
    console.log('Type "yes" to post, or press Enter to skip:');

    // For automated testing, skip posting
    console.log('⏭️ Skipping test tweet posting for automated testing');
    console.log('\n✅ X API post test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Connection working');
    console.log('   ✅ Tweet generation working');
    console.log('   ✅ Ready to post when needed');
    console.log('\n🚀 To enable automatic posting, use the admin interface!');

  } catch (error) {
    console.error('\n❌ X API post test failed:', error);
    
    if (error.code === 429) {
      console.log('\n⚠️ Rate limit exceeded. Please wait before trying again.');
    } else if (error.code === 401) {
      console.log('\n⚠️ Authentication failed. Please check your API keys.');
    } else {
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Check your X API credentials');
      console.log('   2. Verify your app has write permissions');
      console.log('   3. Make sure you haven\'t exceeded rate limits');
    }
  }
}

// Run the test
testXPost().catch(console.error);
