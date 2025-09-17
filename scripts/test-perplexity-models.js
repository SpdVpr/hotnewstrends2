#!/usr/bin/env node

/**
 * Perplexity API Models Test Script
 * Tests all available Perplexity models and their performance
 */

const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

console.log('🤖 Testing Perplexity API Models');
console.log('=================================\n');

// Available models from Perplexity documentation
const AVAILABLE_MODELS = {
  search: [
    'sonar',
    'sonar-pro'
  ],
  reasoning: [
    'sonar-reasoning',
    'sonar-reasoning-pro'
  ],
  research: [
    'sonar-deep-research'
  ]
};

async function testPerplexityModel(model, topic) {
  try {
    console.log(`🧪 Testing model: ${model}`);
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant. Provide a brief, informative response.'
          },
          {
            role: 'user',
            content: `Write a short paragraph about: ${topic}`
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        model,
        success: false,
        error: errorData.error?.message || `HTTP ${response.status}`,
        responseTime: null,
        tokenCount: null
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const tokenCount = data.usage?.total_tokens || 0;

    return {
      model,
      success: true,
      error: null,
      responseTime: data.usage?.completion_time || 'N/A',
      tokenCount,
      contentLength: content.length,
      preview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
    };

  } catch (error) {
    return {
      model,
      success: false,
      error: error.message,
      responseTime: null,
      tokenCount: null
    };
  }
}

async function testModelCategory(categoryName, models, topic) {
  console.log(`\n📂 Testing ${categoryName.toUpperCase()} models:`);
  console.log('='.repeat(40));
  
  const results = [];
  
  for (const model of models) {
    const result = await testPerplexityModel(model, topic);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${model}: SUCCESS`);
      console.log(`   Response time: ${result.responseTime}`);
      console.log(`   Tokens used: ${result.tokenCount}`);
      console.log(`   Content length: ${result.contentLength} chars`);
      console.log(`   Preview: "${result.preview}"`);
    } else {
      console.log(`❌ ${model}: FAILED`);
      console.log(`   Error: ${result.error}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

async function testCurrentImplementation() {
  console.log('\n🔧 Testing Current Implementation:');
  console.log('='.repeat(40));
  
  try {
    const response = await fetch('http://localhost:3002/api/automation/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: 'Perplexity Model Test Implementation',
        category: 'Technology'
      })
    });
    
    const data = await response.json();
    
    if (data.success && data.data.jobId) {
      console.log(`✅ Current implementation working`);
      console.log(`   Job ID: ${data.data.jobId}`);
      console.log(`   Status: ${data.data.status}`);
      console.log(`   Topic: ${data.data.topic}`);
      
      if (data.data.article) {
        console.log(`   Article generated: ${data.data.article.title}`);
        console.log(`   Content length: ${data.data.article.content?.length || 0} chars`);
      }
      
      return { success: true, model: 'sonar-pro' };
    } else {
      console.log(`❌ Current implementation failed: ${data.error || 'Unknown error'}`);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log(`❌ Current implementation error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function generateModelRecommendations(results) {
  console.log('\n💡 Model Recommendations:');
  console.log('='.repeat(40));
  
  const allResults = results.flat();
  const successfulModels = allResults.filter(r => r.success);
  const failedModels = allResults.filter(r => !r.success);
  
  if (successfulModels.length === 0) {
    console.log('❌ No models are working. Check your API key and network connection.');
    return;
  }
  
  // Find fastest model
  const modelsWithTime = successfulModels.filter(r => r.responseTime && r.responseTime !== 'N/A');
  if (modelsWithTime.length > 0) {
    const fastest = modelsWithTime.reduce((prev, curr) => 
      (parseFloat(prev.responseTime) < parseFloat(curr.responseTime)) ? prev : curr
    );
    console.log(`⚡ Fastest model: ${fastest.model} (${fastest.responseTime}s)`);
  }
  
  // Find most efficient (tokens per character)
  const modelsWithTokens = successfulModels.filter(r => r.tokenCount && r.contentLength);
  if (modelsWithTokens.length > 0) {
    const mostEfficient = modelsWithTokens.reduce((prev, curr) => {
      const prevRatio = prev.tokenCount / prev.contentLength;
      const currRatio = curr.tokenCount / curr.contentLength;
      return prevRatio < currRatio ? prev : curr;
    });
    console.log(`💰 Most efficient: ${mostEfficient.model} (${(mostEfficient.tokenCount / mostEfficient.contentLength).toFixed(2)} tokens/char)`);
  }
  
  // Recommendations by use case
  console.log('\n🎯 Recommendations by use case:');
  
  const searchModels = successfulModels.filter(r => r.model.includes('sonar') && !r.model.includes('reasoning') && !r.model.includes('research'));
  const reasoningModels = successfulModels.filter(r => r.model.includes('reasoning'));
  const researchModels = successfulModels.filter(r => r.model.includes('research'));
  
  if (searchModels.length > 0) {
    console.log(`   📊 For quick searches: ${searchModels[0].model}`);
  }
  
  if (reasoningModels.length > 0) {
    console.log(`   🧠 For complex analysis: ${reasoningModels[0].model}`);
  }
  
  if (researchModels.length > 0) {
    console.log(`   🔬 For deep research: ${researchModels[0].model}`);
  }
  
  // Current implementation status
  console.log(`\n🔧 Current implementation: sonar-pro ${successfulModels.find(r => r.model === 'sonar-pro') ? '✅ Working' : '❌ Not working'}`);
  
  if (failedModels.length > 0) {
    console.log(`\n⚠️ Failed models (${failedModels.length}):`);
    failedModels.forEach(model => {
      console.log(`   - ${model.model}: ${model.error}`);
    });
  }
}

// Main test function
async function runTests() {
  try {
    console.log('🚀 Starting Perplexity API model tests...\n');
    console.log(`🔑 API Key: ${process.env.PERPLEXITY_API_KEY ? process.env.PERPLEXITY_API_KEY.substring(0, 20) + '...' : 'NOT SET'}`);
    
    if (!process.env.PERPLEXITY_API_KEY) {
      console.log('❌ PERPLEXITY_API_KEY not found in environment variables');
      process.exit(1);
    }
    
    const testTopic = 'The future of artificial intelligence in 2025';
    const allResults = [];
    
    // Test each category
    for (const [categoryName, models] of Object.entries(AVAILABLE_MODELS)) {
      const results = await testModelCategory(categoryName, models, testTopic);
      allResults.push(results);
    }
    
    // Test current implementation
    const currentResult = await testCurrentImplementation();
    
    // Generate recommendations
    await generateModelRecommendations(allResults);
    
    // Summary
    const totalModels = Object.values(AVAILABLE_MODELS).flat().length;
    const successfulModels = allResults.flat().filter(r => r.success).length;
    
    console.log('\n📊 Test Summary:');
    console.log('='.repeat(40));
    console.log(`Total models tested: ${totalModels}`);
    console.log(`Successful: ${successfulModels}`);
    console.log(`Failed: ${totalModels - successfulModels}`);
    console.log(`Current implementation: ${currentResult.success ? '✅ Working' : '❌ Failed'}`);
    
    if (successfulModels === totalModels && currentResult.success) {
      console.log('\n🎉 All tests passed! Perplexity API is fully functional.');
    } else if (successfulModels > 0) {
      console.log('\n⚠️ Some models failed, but API is partially functional.');
    } else {
      console.log('\n❌ All models failed. Check API key and network connection.');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}
