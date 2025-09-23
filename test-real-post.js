const { TwitterApi } = require('twitter-api-v2');
require('dotenv').config();

async function testRealPost() {
  console.log('🐦 Testing Real X Post...\n');

  try {
    const client = new TwitterApi({
      appKey: process.env.X_API_KEY,
      appSecret: process.env.X_API_SECRET,
      accessToken: process.env.X_ACCESS_TOKEN,
      accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
    });

    // Test connection first
    const user = await client.v2.me();
    console.log('✅ Connected as:', user.data.username);

    // Simple test tweet
    const testTweet = `🧪 Test tweet from HotNewsTrends

Testing X API integration - ${new Date().toISOString()}

#test #hotnewstrends`;

    console.log('📝 Test tweet content:');
    console.log('─'.repeat(50));
    console.log(testTweet);
    console.log('─'.repeat(50));
    console.log(`Length: ${testTweet.length}/280 characters\n`);

    console.log('🚀 Attempting to post...');
    
    // Try to post the tweet
    const result = await client.v2.tweet(testTweet);
    
    console.log('✅ Tweet posted successfully!');
    console.log('🆔 Tweet ID:', result.data.id);
    console.log('📝 Tweet text:', result.data.text);
    console.log('🔗 Tweet URL:', `https://twitter.com/${user.data.username}/status/${result.data.id}`);

  } catch (error) {
    console.error('❌ Failed to post tweet:', error);
    
    if (error.data) {
      console.log('\n📋 Error details:');
      console.log('Code:', error.code);
      console.log('Data:', JSON.stringify(error.data, null, 2));
    }

    if (error.code === 403) {
      console.log('\n🔧 Error 403 Solutions:');
      console.log('1. Go to X Developer Portal: https://developer.twitter.com/en/portal/dashboard');
      console.log('2. Check your app permissions - must be "Read and Write"');
      console.log('3. If permissions are wrong, update them and regenerate tokens');
      console.log('4. Make sure your app is not suspended or restricted');
      console.log('5. Verify you have Essential access (free tier)');
    }

    if (error.code === 429) {
      console.log('\n🔧 Rate limit exceeded:');
      console.log('- You may have hit the daily/hourly limit');
      console.log('- Wait and try again later');
    }
  }
}

testRealPost().catch(console.error);
