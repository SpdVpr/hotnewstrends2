#!/usr/bin/env node

/**
 * Google Trends API Test Script
 * Tests Google Trends integration and data quality
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Testing Google Trends Integration');
console.log('====================================\n');

// Test functions
async function testTrendsAPI() {
  console.log('📊 Testing Trends API...');
  
  try {
    // Test basic trends endpoint
    const response = await fetch('http://localhost:3002/api/trends?source=google');
    const data = await response.json();
    
    if (data.success && data.data.topics) {
      console.log(`✅ Trends API working - ${data.data.total} topics found`);
      console.log(`   Source: ${data.data.source}`);
      console.log(`   Region: ${data.data.region}`);
      console.log(`   Last Updated: ${new Date(data.data.lastUpdated).toLocaleString()}`);
      
      // Show sample topics
      if (data.data.topics.length > 0) {
        console.log('\n📋 Sample trending topics:');
        data.data.topics.slice(0, 3).forEach((topic, index) => {
          console.log(`   ${index + 1}. ${topic.title} (${topic.formattedTraffic})`);
          console.log(`      Category: ${topic.category}`);
          console.log(`      Keywords: ${topic.relatedQueries?.slice(0, 2).join(', ') || 'N/A'}`);
        });
      }
      
      return true;
    } else {
      console.log('❌ Trends API failed:', data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ Trends API error:', error.message);
    return false;
  }
}

async function testTrendsDetails() {
  console.log('\n🔍 Testing Trends Details API...');
  
  try {
    const response = await fetch('http://localhost:3002/api/trends/details');
    const data = await response.json();
    
    if (data.success && data.data.keywords) {
      console.log(`✅ Trends Details API working - ${data.data.total} keywords found`);
      console.log(`   Source: ${data.data.source}`);
      
      // Show sample keywords with content potential
      if (data.data.keywords.length > 0) {
        console.log('\n🎯 Content generation opportunities:');
        data.data.keywords.slice(0, 3).forEach((keyword, index) => {
          console.log(`   ${index + 1}. ${keyword.title}`);
          console.log(`      Traffic: ${keyword.traffic}`);
          console.log(`      Content Score: ${keyword.contentPotential?.score || 'N/A'}`);
          console.log(`      Difficulty: ${keyword.contentPotential?.difficulty || 'N/A'}`);
          console.log(`      Recommendation: ${keyword.contentPotential?.recommendation || 'N/A'}`);
        });
      }
      
      return true;
    } else {
      console.log('❌ Trends Details API failed:', data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ Trends Details API error:', error.message);
    return false;
  }
}

async function testAutomationWithTrends() {
  console.log('\n🤖 Testing Automation with Google Trends...');
  
  try {
    const response = await fetch('http://localhost:3002/api/automation/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: 'Google Trends Test Article',
        category: 'Technology'
      })
    });
    
    const data = await response.json();
    
    if (data.success && data.data.jobId) {
      console.log(`✅ Automation API working - Job ID: ${data.data.jobId}`);
      console.log(`   Status: ${data.data.status}`);
      console.log(`   Topic: ${data.data.topic}`);
      console.log(`   Category: ${data.data.category}`);
      
      if (data.data.article) {
        console.log(`   Article generated: ${data.data.article.title}`);
        console.log(`   Word count: ${data.data.article.content?.length || 0} characters`);
        console.log(`   SEO optimized: ${data.data.article.seoTitle ? 'Yes' : 'No'}`);
      }
      
      return true;
    } else {
      console.log('❌ Automation API failed:', data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ Automation API error:', error.message);
    return false;
  }
}

async function testTrendsByCategory() {
  console.log('\n📂 Testing Trends by Category...');
  
  const categories = ['technology', 'business', 'health', 'entertainment'];
  let successCount = 0;
  
  for (const category of categories) {
    try {
      const response = await fetch(`http://localhost:3002/api/trends?source=google&category=${category}`);
      const data = await response.json();
      
      if (data.success && data.data.topics) {
        console.log(`✅ ${category}: ${data.data.total} topics`);
        successCount++;
      } else {
        console.log(`❌ ${category}: Failed`);
      }
    } catch (error) {
      console.log(`❌ ${category}: Error - ${error.message}`);
    }
  }
  
  console.log(`\n📊 Category test results: ${successCount}/${categories.length} successful`);
  return successCount === categories.length;
}

async function testDataQuality() {
  console.log('\n🔍 Testing Data Quality...');
  
  try {
    const response = await fetch('http://localhost:3002/api/trends?source=google');
    const data = await response.json();
    
    if (!data.success || !data.data.topics) {
      console.log('❌ No data available for quality check');
      return false;
    }
    
    const topics = data.data.topics;
    let qualityScore = 0;
    let checks = 0;
    
    // Check 1: Topics have titles
    const topicsWithTitles = topics.filter(t => t.title && t.title.length > 0);
    const titleScore = (topicsWithTitles.length / topics.length) * 100;
    console.log(`   Titles: ${titleScore.toFixed(1)}% (${topicsWithTitles.length}/${topics.length})`);
    qualityScore += titleScore;
    checks++;
    
    // Check 2: Topics have categories
    const topicsWithCategories = topics.filter(t => t.category && t.category !== 'General');
    const categoryScore = (topicsWithCategories.length / topics.length) * 100;
    console.log(`   Categories: ${categoryScore.toFixed(1)}% (${topicsWithCategories.length}/${topics.length})`);
    qualityScore += categoryScore;
    checks++;
    
    // Check 3: Topics have traffic data
    const topicsWithTraffic = topics.filter(t => t.formattedTraffic && t.formattedTraffic !== '0+');
    const trafficScore = (topicsWithTraffic.length / topics.length) * 100;
    console.log(`   Traffic Data: ${trafficScore.toFixed(1)}% (${topicsWithTraffic.length}/${topics.length})`);
    qualityScore += trafficScore;
    checks++;
    
    // Check 4: Topics have related queries
    const topicsWithQueries = topics.filter(t => t.relatedQueries && t.relatedQueries.length > 0);
    const queriesScore = (topicsWithQueries.length / topics.length) * 100;
    console.log(`   Related Queries: ${queriesScore.toFixed(1)}% (${topicsWithQueries.length}/${topics.length})`);
    qualityScore += queriesScore;
    checks++;
    
    const averageQuality = qualityScore / checks;
    console.log(`\n📊 Overall Data Quality: ${averageQuality.toFixed(1)}%`);
    
    if (averageQuality >= 80) {
      console.log('✅ Excellent data quality');
      return true;
    } else if (averageQuality >= 60) {
      console.log('⚠️ Good data quality');
      return true;
    } else {
      console.log('❌ Poor data quality - needs improvement');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Data quality check failed:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  try {
    console.log('🚀 Starting Google Trends integration tests...\n');
    
    const results = {
      trendsAPI: await testTrendsAPI(),
      trendsDetails: await testTrendsDetails(),
      automation: await testAutomationWithTrends(),
      categories: await testTrendsByCategory(),
      dataQuality: await testDataQuality()
    };
    
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All Google Trends integration tests passed!');
      console.log('✅ Ready for production content generation');
    } else {
      console.log('⚠️ Some tests failed - check configuration');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}
