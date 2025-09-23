require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');

async function testXApi() {
  console.log('🐦 Testing X API Integration...\n');

  // Check environment variables
  console.log('📋 Checking environment variables:');
  const requiredVars = [
    'X_API_KEY',
    'X_API_SECRET', 
    'X_ACCESS_TOKEN',
    'X_ACCESS_TOKEN_SECRET'
  ];

  let allVarsPresent = true;
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 8)}...`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      allVarsPresent = false;
    }
  }

  if (!allVarsPresent) {
    console.log('\n❌ Some environment variables are missing. Please check your .env file.');
    return;
  }

  try {
    // Initialize Twitter client
    console.log('\n🔧 Initializing X API client...');
    const client = new TwitterApi({
      appKey: process.env.X_API_KEY,
      appSecret: process.env.X_API_SECRET,
      accessToken: process.env.X_ACCESS_TOKEN,
      accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
    });

    // Test connection by getting user info
    console.log('🔍 Testing connection...');
    const user = await client.v2.me();
    console.log('✅ Connection successful!');
    console.log(`📱 Account: @${user.data.username}`);
    console.log(`👤 Name: ${user.data.name}`);
    console.log(`🆔 ID: ${user.data.id}`);

    // Check rate limits
    console.log('\n📊 Checking rate limits...');
    try {
      const rateLimits = await client.v2.rateLimits();
      const tweetLimit = rateLimits['POST /2/tweets'];
      
      if (tweetLimit) {
        console.log(`📝 Tweet posting limit:`);
        console.log(`   Remaining: ${tweetLimit.remaining}`);
        console.log(`   Reset time: ${new Date(tweetLimit.reset * 1000).toLocaleString()}`);
      } else {
        console.log('⚠️ Could not retrieve tweet posting rate limit');
      }
    } catch (error) {
      console.log('⚠️ Could not retrieve rate limits:', error.message);
    }

    // Test tweet generation (without posting)
    console.log('\n📝 Testing tweet generation...');
    const testArticle = {
      title: 'Breaking: New AI Technology Revolutionizes Content Creation',
      url: 'https://hotnewstrends.com/article/ai-technology-revolution',
      category: 'Technology',
      tags: ['AI', 'innovation', 'tech']
    };

    const tweetText = generateTweetText(testArticle);
    console.log('Generated tweet text:');
    console.log('─'.repeat(50));
    console.log(tweetText);
    console.log('─'.repeat(50));
    console.log(`Length: ${tweetText.length}/280 characters`);

    // Ask user if they want to post a test tweet
    console.log('\n🤔 Would you like to post a test tweet? (This will count towards your daily limit)');
    console.log('Type "yes" to post, or press Enter to skip:');
    
    // For automated testing, skip the interactive part
    console.log('⏭️ Skipping test tweet posting for automated testing');

    console.log('\n✅ X API integration test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Environment variables configured');
    console.log('   ✅ API connection working');
    console.log('   ✅ User authentication successful');
    console.log('   ✅ Tweet generation working');
    console.log('\n🚀 Ready to start sharing articles on X!');

  } catch (error) {
    console.error('\n❌ X API test failed:', error.message);
    
    if (error.code === 401) {
      console.log('\n💡 This looks like an authentication error. Please check:');
      console.log('   1. Your API keys are correct');
      console.log('   2. Your access tokens are valid');
      console.log('   3. Your X app has the correct permissions');
    } else if (error.code === 429) {
      console.log('\n💡 Rate limit exceeded. Please wait before testing again.');
    } else {
      console.log('\n💡 Please check your X API credentials and try again.');
    }
  }
}

function generateTweetText(data) {
  const { title, url, category, tags = [] } = data;
  
  // Create hashtags from category and tags
  const hashtags = [
    `#${category.toLowerCase().replace(/\s+/g, '')}`,
    '#news',
    '#trending',
    ...tags.slice(0, 2).map(tag => `#${tag.toLowerCase().replace(/\s+/g, '')}`)
  ].slice(0, 4); // Limit to 4 hashtags

  // Calculate available space for title (280 - URL - hashtags - spaces)
  const hashtagsText = hashtags.join(' ');
  const urlLength = 23; // Twitter's t.co URL length
  const availableForTitle = 280 - urlLength - hashtagsText.length - 3; // 3 for spaces

  // Truncate title if necessary
  let tweetTitle = title;
  if (tweetTitle.length > availableForTitle) {
    tweetTitle = tweetTitle.substring(0, availableForTitle - 3) + '...';
  }

  return `${tweetTitle}\n\n${url}\n\n${hashtagsText}`;
}

// Run the test
testXApi().catch(console.error);
