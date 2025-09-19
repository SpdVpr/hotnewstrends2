#!/usr/bin/env node

/**
 * Firebase Credentials Test Script
 * 
 * Tento script testuje funkčnost FIREBASE_SERVICE_ACCOUNT_KEY
 * pro lokální vývoj před nasazením na produkci.
 * 
 * Použití:
 * node test-firebase-credentials.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Načtení environment variables z .env.local
function loadEnvLocal() {
  const envPath = path.join(__dirname, '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local soubor nenalezen!');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=');
        process.env[key] = value;
      }
    }
  });
}

// Test Firebase inicializace
async function testFirebaseInit() {
  console.log('\n🔧 === FIREBASE CREDENTIALS TEST ===\n');
  
  try {
    // 1. Načtení environment variables
    console.log('📋 1. Načítání .env.local...');
    loadEnvLocal();
    
    // 2. Kontrola existence FIREBASE_SERVICE_ACCOUNT_KEY
    console.log('🔍 2. Kontrola FIREBASE_SERVICE_ACCOUNT_KEY...');
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKey) {
      console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY není nastavena v .env.local');
      return false;
    }
    
    console.log('✅ FIREBASE_SERVICE_ACCOUNT_KEY nalezena');
    console.log(`📏 Délka: ${serviceAccountKey.length} znaků`);
    
    // 3. Parsování JSON
    console.log('🔍 3. Parsování JSON...');
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountKey);
      console.log('✅ JSON je validní');
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError.message);
      console.log('🔍 První 100 znaků:', serviceAccountKey.substring(0, 100));
      return false;
    }
    
    // 4. Kontrola povinných polí
    console.log('🔍 4. Kontrola povinných polí...');
    const requiredFields = [
      'type', 'project_id', 'private_key_id', 'private_key', 
      'client_email', 'client_id', 'auth_uri', 'token_uri'
    ];
    
    const missingFields = requiredFields.filter(field => !serviceAccount[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Chybí povinná pole:', missingFields.join(', '));
      return false;
    }
    
    console.log('✅ Všechna povinná pole jsou přítomna');
    console.log(`📧 Client email: ${serviceAccount.client_email}`);
    console.log(`🆔 Project ID: ${serviceAccount.project_id}`);
    
    // 5. Inicializace Firebase Admin
    console.log('🔍 5. Inicializace Firebase Admin...');
    
    // Kontrola, jestli už není inicializovaný
    if (admin.apps.length > 0) {
      console.log('⚠️  Firebase Admin už je inicializovaný, používám existující instanci');
    } else {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      console.log('✅ Firebase Admin úspěšně inicializován');
    }
    
    // 6. Test Firestore připojení
    console.log('🔍 6. Test Firestore připojení...');
    const db = admin.firestore();
    
    // Test write
    console.log('📝 Testování zápisu do Firestore...');
    const testDoc = db.collection('test').doc('firebase-test');
    await testDoc.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      message: 'Firebase credentials test successful',
      testId: Date.now()
    });
    console.log('✅ Zápis do Firestore úspěšný');
    
    // Test read
    console.log('📖 Testování čtení z Firestore...');
    const docSnapshot = await testDoc.get();
    if (docSnapshot.exists) {
      const data = docSnapshot.data();
      console.log('✅ Čtení z Firestore úspěšné');
      console.log('📄 Data:', {
        message: data.message,
        testId: data.testId,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || 'N/A'
      });
    } else {
      console.error('❌ Dokument nebyl nalezen po zápisu');
      return false;
    }
    
    // 7. Test service status operací (simulace skutečného použití)
    console.log('🔍 7. Test service status operací...');
    
    const statusDoc = db.collection('system').doc('article_generator_service_status');
    
    // Store status
    await statusDoc.set({
      isRunning: true,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      testMode: true,
      source: 'firebase_credentials_test'
    });
    console.log('✅ Service status uložen');
    
    // Load status
    const statusSnapshot = await statusDoc.get();
    if (statusSnapshot.exists) {
      const statusData = statusSnapshot.data();
      console.log('✅ Service status načten');
      console.log('📊 Status data:', {
        isRunning: statusData.isRunning,
        testMode: statusData.testMode,
        source: statusData.source
      });
    }
    
    // 8. Cleanup
    console.log('🧹 8. Cleanup test dokumentů...');
    await testDoc.delete();
    await statusDoc.delete();
    console.log('✅ Test dokumenty smazány');
    
    console.log('\n🎉 === VŠECHNY TESTY ÚSPĚŠNÉ ===');
    console.log('✅ Firebase credentials jsou správně nastavené');
    console.log('✅ Firestore připojení funguje');
    console.log('✅ Read/Write operace fungují');
    console.log('✅ Service status operace fungují');
    console.log('\n🚀 Můžete nasadit na produkci!');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ === TEST SELHAL ===');
    console.error('🔥 Error:', error.message);
    
    if (error.code) {
      console.error('🔍 Error code:', error.code);
    }
    
    if (error.stack) {
      console.error('📚 Stack trace:');
      console.error(error.stack);
    }
    
    // Specifické chyby a jejich řešení
    if (error.message.includes('PERMISSION_DENIED')) {
      console.log('\n💡 Možné řešení:');
      console.log('- Zkontrolujte Firestore Security Rules');
      console.log('- Ujistěte se, že service account má správná oprávnění');
    }
    
    if (error.message.includes('INVALID_ARGUMENT')) {
      console.log('\n💡 Možné řešení:');
      console.log('- Zkontrolujte formát JSON v FIREBASE_SERVICE_ACCOUNT_KEY');
      console.log('- Ujistěte se, že private_key obsahuje správné \\n escape sekvence');
    }
    
    return false;
  }
}

// Spuštění testu
if (require.main === module) {
  testFirebaseInit()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testFirebaseInit };
