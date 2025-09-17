#!/usr/bin/env node

/**
 * Firebase Initialization Script
 * This script helps set up Firebase project and initialize collections
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 Firebase Setup for TrendyBlogger.com');
console.log('=====================================\n');

// Check if Firebase CLI is installed
function checkFirebaseCLI() {
  try {
    execSync('firebase --version', { stdio: 'ignore' });
    console.log('✅ Firebase CLI is installed');
    return true;
  } catch (error) {
    console.log('❌ Firebase CLI not found');
    console.log('📦 Installing Firebase CLI...');
    try {
      execSync('npm install -g firebase-tools', { stdio: 'inherit' });
      console.log('✅ Firebase CLI installed successfully');
      return true;
    } catch (installError) {
      console.error('❌ Failed to install Firebase CLI');
      console.log('Please install manually: npm install -g firebase-tools');
      return false;
    }
  }
}

// Initialize Firebase project
function initFirebaseProject() {
  console.log('\n🚀 Initializing Firebase project...');
  
  try {
    // Login to Firebase (if not already logged in)
    console.log('🔐 Checking Firebase authentication...');
    try {
      execSync('firebase projects:list', { stdio: 'ignore' });
      console.log('✅ Already logged in to Firebase');
    } catch (error) {
      console.log('🔐 Please log in to Firebase...');
      execSync('firebase login', { stdio: 'inherit' });
    }

    // Initialize Firebase in current directory
    console.log('📁 Initializing Firebase configuration...');
    
    // Create firebase.json if it doesn't exist
    const firebaseConfig = {
      "firestore": {
        "rules": "firestore.rules",
        "indexes": "firestore.indexes.json"
      },
      "hosting": {
        "public": "out",
        "ignore": [
          "firebase.json",
          "**/.*",
          "**/node_modules/**"
        ],
        "rewrites": [
          {
            "source": "**",
            "destination": "/index.html"
          }
        ]
      },
      "storage": {
        "rules": "storage.rules"
      },
      "functions": {
        "source": "functions",
        "runtime": "nodejs18"
      }
    };

    fs.writeFileSync('firebase.json', JSON.stringify(firebaseConfig, null, 2));
    console.log('✅ firebase.json created');

    // Create Firestore rules
    const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Articles - public read, admin write
    match /articles/{articleId} {
      allow read: if resource.data.status == 'published';
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Categories - public read, admin write
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    

    
    // Analytics - admin only
    match /analytics/{analyticsId} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Automation jobs - admin only
    match /automation_jobs/{jobId} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Trends - admin only
    match /trends/{trendId} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Settings - admin only
    match /settings/{settingId} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}`;

    fs.writeFileSync('firestore.rules', firestoreRules);
    console.log('✅ firestore.rules created');

    // Create Firestore indexes
    const firestoreIndexes = {
      "indexes": [
        {
          "collectionGroup": "articles",
          "queryScope": "COLLECTION",
          "fields": [
            { "fieldPath": "status", "order": "ASCENDING" },
            { "fieldPath": "publishedAt", "order": "DESCENDING" }
          ]
        },
        {
          "collectionGroup": "articles",
          "queryScope": "COLLECTION",
          "fields": [
            { "fieldPath": "category.slug", "order": "ASCENDING" },
            { "fieldPath": "status", "order": "ASCENDING" },
            { "fieldPath": "publishedAt", "order": "DESCENDING" }
          ]
        },
        {
          "collectionGroup": "articles",
          "queryScope": "COLLECTION",
          "fields": [
            { "fieldPath": "featured", "order": "ASCENDING" },
            { "fieldPath": "status", "order": "ASCENDING" },
            { "fieldPath": "publishedAt", "order": "DESCENDING" }
          ]
        },
        {
          "collectionGroup": "articles",
          "queryScope": "COLLECTION",
          "fields": [
            { "fieldPath": "trending", "order": "ASCENDING" },
            { "fieldPath": "status", "order": "ASCENDING" },
            { "fieldPath": "views", "order": "DESCENDING" }
          ]
        },
        {
          "collectionGroup": "articles",
          "queryScope": "COLLECTION",
          "fields": [
            { "fieldPath": "tags", "arrayConfig": "CONTAINS" },
            { "fieldPath": "status", "order": "ASCENDING" },
            { "fieldPath": "publishedAt", "order": "DESCENDING" }
          ]
        }
      ],
      "fieldOverrides": []
    };

    fs.writeFileSync('firestore.indexes.json', JSON.stringify(firestoreIndexes, null, 2));
    console.log('✅ firestore.indexes.json created');

    // Create Storage rules
    const storageRules = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Images - public read, admin write
    match /images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // User uploads - authenticated users only
    match /uploads/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;

    fs.writeFileSync('storage.rules', storageRules);
    console.log('✅ storage.rules created');

    console.log('\n🎉 Firebase configuration files created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Create a new Firebase project at https://console.firebase.google.com');
    console.log('2. Enable Firestore Database');
    console.log('3. Enable Authentication (Email/Password)');
    console.log('4. Enable Storage');
    console.log('5. Copy your Firebase config to .env.local');
    console.log('6. Run: firebase use --add [your-project-id]');
    console.log('7. Run: firebase deploy --only firestore:rules,firestore:indexes,storage');

  } catch (error) {
    console.error('❌ Error initializing Firebase:', error.message);
    process.exit(1);
  }
}

// Create sample data script
function createSampleDataScript() {
  const sampleDataScript = `// Sample data for Firebase initialization
import { firebaseArticlesService } from '../src/lib/services/firebase-articles';

const sampleCategories = [
  {
    name: 'Technology',
    slug: 'technology',
    description: 'Latest tech trends and innovations',
    color: '#007AFF',
    icon: '💻',
    order: 1,
    articleCount: 0,
    featured: true
  },
  {
    name: 'Business',
    slug: 'business',
    description: 'Business news and market insights',
    color: '#FF6B35',
    icon: '📊',
    order: 2,
    articleCount: 0,
    featured: true
  },
  {
    name: 'Science',
    slug: 'science',
    description: 'Scientific discoveries and research',
    color: '#34C759',
    icon: '🔬',
    order: 3,
    articleCount: 0,
    featured: true
  }
];

const sampleArticles = [
  {
    title: 'AI Revolution Transforms Digital Marketing',
    slug: 'ai-revolution-transforms-digital-marketing',
    excerpt: 'Artificial intelligence is reshaping how businesses approach digital marketing.',
    content: '# AI Revolution Transforms Digital Marketing\\n\\nArtificial intelligence is fundamentally changing...',
    author: 'Sarah Chen',
    category: {
      id: 'tech-001',
      name: 'Technology',
      slug: 'technology'
    },
    tags: ['AI', 'Marketing', 'Technology', 'Business'],
    seoTitle: 'AI Revolution in Digital Marketing | TrendyBlogger',
    seoDescription: 'Discover how AI is transforming digital marketing strategies.',
    seoKeywords: ['AI marketing', 'digital transformation', 'artificial intelligence'],
    readTime: '5 min read',
    status: 'published',
    publishedAt: new Date(),
    featured: true,
    trending: true,
    sources: ['https://example.com/source1'],
    confidence: 0.9
  }
];

export { sampleCategories, sampleArticles };`;

  fs.writeFileSync('scripts/sample-data.js', sampleDataScript);
  console.log('✅ Sample data script created');
}

// Main execution
async function main() {
  try {
    if (!checkFirebaseCLI()) {
      process.exit(1);
    }

    initFirebaseProject();
    createSampleDataScript();

    console.log('\n🎉 Firebase setup completed successfully!');
    console.log('\n📚 Documentation:');
    console.log('- Firebase Console: https://console.firebase.google.com');
    console.log('- Firestore Documentation: https://firebase.google.com/docs/firestore');
    console.log('- Firebase Auth: https://firebase.google.com/docs/auth');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
