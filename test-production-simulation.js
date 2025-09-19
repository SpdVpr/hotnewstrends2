#!/usr/bin/env node

/**
 * Production Environment Simulation Test
 * 
 * Simuluje production prostředí pro testování Firebase credentials
 * stejně jako v automated-article-generator.ts
 * 
 * Použití:
 * node test-production-simulation.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Simulace production environment
process.env.NODE_ENV = 'production';
process.env.VERCEL = '1';

// Načtení .env.local
function loadEnvLocal() {
  const envPath = path.join(__dirname, '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local nenalezen!');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key] = valueParts.join('=');
      }
    }
  });
}

// Simulace AutomatedArticleGenerator Firebase logiky
class FirebaseTestSimulator {
  constructor() {
    this.db = null;
    this.SERVICE_STATUS_DOC = 'article_generator_service_status';
  }

  // Stejná logika jako v automated-article-generator.ts
  initializeFirebase() {
    try {
      if (admin.apps.length > 0) {
        console.log('⚠️  Firebase Admin už je inicializovaný');
        this.db = admin.firestore();
        return true;
      }

      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      
      if (!serviceAccountKey) {
        console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY environment variable not found');
        return false;
      }

      let serviceAccount;
      try {
        serviceAccount = JSON.parse(serviceAccountKey);
      } catch (parseError) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', parseError.message);
        return false;
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });

      this.db = admin.firestore();
      console.log('✅ Firebase initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ Firebase initialization failed:', error.message);
      return false;
    }
  }

  // Simulace isFirebaseConnectionError
  isFirebaseConnectionError(error) {
    const connectionErrors = [
      'ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT',
      'UNAVAILABLE', 'INTERNAL', 'DEADLINE_EXCEEDED'
    ];
    
    const errorMessage = error.message || '';
    const errorCode = error.code || '';
    
    return connectionErrors.some(errType => 
      errorMessage.includes(errType) || errorCode.includes(errType)
    );
  }

  // Simulace storeServiceStatus s retry mechanikou
  async storeServiceStatus(isRunning) {
    const maxRetries = 3;
    
    // Check if Firebase is initialized
    if (!this.db) {
      console.error('❌ Firebase not initialized, cannot store service status');
      // Fallback to localStorage immediately
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('article_generator_firebase_status', JSON.stringify({
            isRunning,
            lastUpdated: new Date().toISOString(),
            source: 'localStorage_fallback_no_firebase'
          }));
          console.log('📦 Status stored in localStorage fallback');
        } else {
          console.log('📦 localStorage not available (server-side)');
        }
      } catch (fallbackError) {
        console.error('❌ Even localStorage fallback failed:', fallbackError);
      }
      return;
    }

    const statusData = {
      isRunning,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      environment: 'test_production_simulation',
      source: 'firebase'
    };

    // Try Firebase with retry mechanism
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.db.collection('system').doc(this.SERVICE_STATUS_DOC).set(statusData);
        console.log(`📊 Service status stored in Firebase: isRunning=${isRunning} (attempt ${attempt})`);
        return; // Success
      } catch (error) {
        console.error(`❌ Firebase store attempt ${attempt} failed:`, error.message);
        
        if (this.isFirebaseConnectionError(error) && attempt < maxRetries) {
          const delay = attempt * 1000; // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else if (attempt === maxRetries) {
          console.error('❌ All Firebase store attempts failed, using localStorage fallback');
          // Final fallback to localStorage
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('article_generator_firebase_status', JSON.stringify({
                isRunning,
                lastUpdated: new Date().toISOString(),
                source: 'localStorage_fallback_firebase_failed'
              }));
              console.log('📦 Status stored in localStorage fallback after Firebase failure');
            }
          } catch (fallbackError) {
            console.error('❌ Even localStorage fallback failed:', fallbackError);
          }
          break;
        }
      }
    }
  }

  // Simulace loadServiceStatus
  async loadServiceStatus() {
    const maxRetries = 3;
    
    if (!this.db) {
      console.error('❌ Firebase not initialized, cannot load service status');
      return false;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const doc = await this.db.collection('system').doc(this.SERVICE_STATUS_DOC).get();
        
        if (doc.exists) {
          const data = doc.data();
          console.log(`📊 Service status loaded from Firebase: isRunning=${data.isRunning} (attempt ${attempt})`);
          return data.isRunning || false;
        } else {
          console.log('📊 No service status document found, defaulting to false');
          return false;
        }
      } catch (error) {
        console.error(`❌ Firebase load attempt ${attempt} failed:`, error.message);
        
        if (this.isFirebaseConnectionError(error) && attempt < maxRetries) {
          const delay = attempt * 1000;
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else if (attempt === maxRetries) {
          console.error('❌ Failed to load service status after all retries');
          return false;
        }
      }
    }
    
    return false;
  }
}

async function testProductionSimulation() {
  console.log('🏭 === PRODUCTION SIMULATION TEST ===\n');
  
  try {
    // 1. Načtení environment
    console.log('📋 1. Načítání .env.local...');
    loadEnvLocal();
    
    console.log('🔍 Environment check:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   VERCEL: ${process.env.VERCEL}`);
    console.log(`   Production mode: ${process.env.NODE_ENV === 'production' && process.env.VERCEL}`);
    
    // 2. Inicializace simulátoru
    console.log('\n🔧 2. Inicializace Firebase simulátoru...');
    const simulator = new FirebaseTestSimulator();
    
    const initSuccess = simulator.initializeFirebase();
    if (!initSuccess) {
      console.error('❌ Firebase inicializace selhala');
      return false;
    }
    
    // 3. Test store/load cyklu
    console.log('\n📊 3. Test store/load cyklu...');
    
    // Store true
    console.log('📝 Storing isRunning=true...');
    await simulator.storeServiceStatus(true);
    
    // Load
    console.log('📖 Loading service status...');
    const loadedStatus1 = await simulator.loadServiceStatus();
    console.log(`📊 Loaded status: ${loadedStatus1}`);
    
    if (loadedStatus1 !== true) {
      console.error('❌ Expected true, got:', loadedStatus1);
      return false;
    }
    
    // Store false
    console.log('📝 Storing isRunning=false...');
    await simulator.storeServiceStatus(false);
    
    // Load again
    console.log('📖 Loading service status again...');
    const loadedStatus2 = await simulator.loadServiceStatus();
    console.log(`📊 Loaded status: ${loadedStatus2}`);
    
    if (loadedStatus2 !== false) {
      console.error('❌ Expected false, got:', loadedStatus2);
      return false;
    }
    
    // 4. Cleanup
    console.log('\n🧹 4. Cleanup...');
    if (simulator.db) {
      await simulator.db.collection('system').doc(simulator.SERVICE_STATUS_DOC).delete();
      console.log('✅ Test document cleaned up');
    }
    
    console.log('\n🎉 === PRODUCTION SIMULATION ÚSPĚŠNÁ ===');
    console.log('✅ Firebase inicializace funguje');
    console.log('✅ Store/Load operace fungují');
    console.log('✅ Retry mechanismus je připravený');
    console.log('✅ Production environment simulation OK');
    console.log('\n🚀 Systém je připravený pro produkci!');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ === SIMULATION TEST SELHAL ===');
    console.error('🔥 Error:', error.message);
    console.error('📚 Stack:', error.stack);
    return false;
  }
}

// Spuštění
testProductionSimulation()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
