#!/usr/bin/env node

/**
 * Firebase Write Test Script
 * Tests Firebase write permissions and article creation
 */

const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

console.log('🔥 Testing Firebase Write Permissions');
console.log('=====================================\n');

async function testFirebaseWrite() {
  try {
    console.log('📝 Testing Firebase article creation...');
    
    // Dynamic import to avoid build issues
    const { initializeApp } = await import('firebase/app');
    const { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } = await import('firebase/firestore');
    
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    };
    
    console.log(`🔗 Connecting to project: ${firebaseConfig.projectId}`);
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Test 1: Create a test article
    console.log('📝 Creating test article...');
    const testArticle = {
      title: 'Firebase Write Permission Test',
      slug: 'firebase-write-test-' + Date.now(),
      excerpt: 'Testing Firebase write permissions for article creation',
      content: 'This is a test article to verify Firebase write permissions are working correctly.',
      author: 'System Test',
      category: 'Technology',
      tags: ['firebase', 'test', 'permissions'],
      seoTitle: 'Firebase Write Test | TrendyBlogger',
      seoDescription: 'Testing Firebase write permissions',
      seoKeywords: ['firebase', 'test'],
      image: 'https://via.placeholder.com/800x400',
      readTime: 1,
      status: 'published',
      publishedAt: new Date(),
      featured: false,
      trending: false,
      sources: [],
      confidence: 1.0,
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const articlesRef = collection(db, 'articles');
    const docRef = await addDoc(articlesRef, testArticle);
    console.log(`✅ Test article created with ID: ${docRef.id}`);
    
    // Test 2: Read the article back
    console.log('📖 Reading articles from Firebase...');
    const snapshot = await getDocs(articlesRef);
    const articles = [];
    snapshot.forEach((doc) => {
      articles.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`✅ Found ${articles.length} articles in Firebase`);
    
    // Show recent articles
    const recentArticles = articles
      .sort((a, b) => new Date(b.createdAt?.seconds * 1000 || b.createdAt) - new Date(a.createdAt?.seconds * 1000 || a.createdAt))
      .slice(0, 5);
    
    console.log('\n📋 Recent articles in Firebase:');
    recentArticles.forEach((article, index) => {
      const createdAt = article.createdAt?.seconds 
        ? new Date(article.createdAt.seconds * 1000).toLocaleString()
        : new Date(article.createdAt).toLocaleString();
      console.log(`   ${index + 1}. ${article.title}`);
      console.log(`      ID: ${article.id}`);
      console.log(`      Category: ${article.category}`);
      console.log(`      Created: ${createdAt}`);
      console.log(`      Status: ${article.status}`);
    });
    
    // Test 3: Clean up test article
    console.log(`\n🧹 Cleaning up test article: ${docRef.id}`);
    await deleteDoc(doc(db, 'articles', docRef.id));
    console.log('✅ Test article deleted successfully');
    
    return true;
    
  } catch (error) {
    console.error('❌ Firebase write test failed:', error);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 Permission denied error detected:');
      console.log('   - Check Firebase security rules');
      console.log('   - Ensure rules allow write access');
      console.log('   - Run: firebase deploy --only firestore:rules');
    } else if (error.code === 'unauthenticated') {
      console.log('\n💡 Authentication error detected:');
      console.log('   - Check Firebase configuration');
      console.log('   - Verify API keys are correct');
    } else {
      console.log('\n💡 Other error detected:');
      console.log(`   - Error code: ${error.code || 'unknown'}`);
      console.log(`   - Error message: ${error.message}`);
    }
    
    return false;
  }
}

async function testAutomationAPI() {
  console.log('\n🤖 Testing Automation API with Firebase...');
  
  try {
    const response = await fetch('http://localhost:3002/api/automation/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: 'Firebase Integration Success Test',
        category: 'Technology'
      })
    });
    
    const data = await response.json();
    
    if (data.success && data.data.jobId) {
      console.log(`✅ Automation API working - Job ID: ${data.data.jobId}`);
      console.log(`   Status: ${data.data.status}`);
      console.log(`   Topic: ${data.data.topic}`);
      
      if (data.data.article) {
        console.log(`   Article created: ${data.data.article.title}`);
        console.log(`   Article ID: ${data.data.article.id || 'N/A'}`);
        console.log(`   Saved to Firebase: ${data.data.article.id ? 'Yes' : 'No'}`);
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

// Main test function
async function runTests() {
  try {
    console.log('🚀 Starting Firebase write permission tests...\n');
    
    const results = {
      firebaseWrite: await testFirebaseWrite(),
      automationAPI: await testAutomationAPI()
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
      console.log('🎉 All Firebase write tests passed!');
      console.log('✅ Firebase permissions are correctly configured');
      console.log('🚀 Ready for production article generation');
    } else {
      console.log('⚠️ Some tests failed - check Firebase configuration');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}
