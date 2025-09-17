#!/usr/bin/env node

/**
 * Firebase Connection Test Script
 * Tests Firebase configuration and basic connectivity
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔥 Testing Firebase Connection');
console.log('==============================\n');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Check environment variables
function checkEnvVars() {
  console.log('📋 Checking environment variables...');
  
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];
  
  const missing = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName] || process.env[varName] === 'your_api_key_here' || process.env[varName].includes('your_')) {
      missing.push(varName);
    } else {
      console.log(`✅ ${varName}: ${process.env[varName].substring(0, 20)}...`);
    }
  });
  
  if (missing.length > 0) {
    console.log('\n❌ Missing or placeholder environment variables:');
    missing.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\n📝 Please update your .env.local file with actual Firebase values.');
    return false;
  }
  
  console.log('✅ All environment variables configured\n');
  return true;
}

// Test Firebase project connection
function testFirebaseProject() {
  console.log('🔗 Testing Firebase project connection...');
  
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    console.log(`📡 Connecting to project: ${projectId}`);
    
    // Test if project exists and is accessible
    const result = execSync(`firebase projects:list --json`, { encoding: 'utf8' });
    const data = JSON.parse(result);
    const projects = data.projects || data;

    const project = projects.find(p => p.projectId === projectId);
    
    if (project) {
      console.log(`✅ Project found: ${project.displayName}`);
      console.log(`   Project ID: ${project.projectId}`);
      console.log(`   State: ${project.state || 'ACTIVE'}\n`);
      return true;
    } else {
      console.log(`❌ Project '${projectId}' not found in your Firebase projects`);
      console.log('📋 Available projects:');
      projects.forEach(p => {
        console.log(`   - ${p.projectId} (${p.displayName})`);
      });
      return false;
    }
  } catch (error) {
    console.log('❌ Error connecting to Firebase:', error.message);
    return false;
  }
}

// Test Firestore connection
async function testFirestore() {
  console.log('🗄️  Testing Firestore connection...');
  
  try {
    // Dynamic import to avoid build issues
    const { initializeApp } = await import('firebase/app');
    const { getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc, deleteDoc } = await import('firebase/firestore');
    
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    };
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Test write operation
    const testDoc = doc(db, 'test', 'connection-test');
    await setDoc(testDoc, {
      message: 'Firebase connection test',
      timestamp: new Date(),
      success: true
    });
    
    console.log('✅ Write test successful');
    
    // Test read operation
    const docSnap = await getDoc(testDoc);
    if (docSnap.exists()) {
      console.log('✅ Read test successful');
      console.log(`   Data: ${JSON.stringify(docSnap.data())}`);
    } else {
      console.log('❌ Read test failed - document not found');
      return false;
    }
    
    // Clean up test document
    await deleteDoc(testDoc);
    console.log('✅ Cleanup successful\n');
    
    return true;
  } catch (error) {
    console.log('❌ Firestore test failed:', error.message);
    if (error.code === 'permission-denied') {
      console.log('💡 This might be due to Firestore security rules. Check your Firebase console.');
    }
    return false;
  }
}

// Main test function
async function runTests() {
  try {
    console.log('🚀 Starting Firebase connection tests...\n');
    
    // Test 1: Environment variables
    if (!checkEnvVars()) {
      process.exit(1);
    }
    
    // Test 2: Firebase project connection
    if (!testFirebaseProject()) {
      process.exit(1);
    }
    
    // Test 3: Firestore connection
    if (!(await testFirestore())) {
      process.exit(1);
    }
    
    console.log('🎉 All Firebase tests passed!');
    console.log('✅ Firebase is properly configured and connected');
    console.log('🚀 Ready for production deployment');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}
