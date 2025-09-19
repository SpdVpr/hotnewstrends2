#!/usr/bin/env node

/**
 * Rychlý Firebase Test
 * 
 * Jednoduchý test pro rychlé ověření Firebase credentials
 * 
 * Použití:
 * node quick-firebase-test.js
 */

const fs = require('fs');
const path = require('path');

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

async function quickTest() {
  console.log('🔧 Rychlý Firebase Test\n');
  
  try {
    // 1. Načtení env
    loadEnvLocal();
    
    // 2. Kontrola FIREBASE_SERVICE_ACCOUNT_KEY
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKey) {
      console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY chybí');
      return false;
    }
    
    console.log('✅ FIREBASE_SERVICE_ACCOUNT_KEY nalezena');
    console.log(`📏 Délka: ${serviceAccountKey.length} znaků`);
    
    // 3. JSON parsing
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountKey);
      console.log('✅ JSON je validní');
    } catch (e) {
      console.error('❌ JSON parsing error:', e.message);
      console.log('🔍 Začátek:', serviceAccountKey.substring(0, 50) + '...');
      return false;
    }
    
    // 4. Kontrola klíčových polí
    const required = ['type', 'project_id', 'private_key', 'client_email'];
    const missing = required.filter(field => !serviceAccount[field]);
    
    if (missing.length > 0) {
      console.error('❌ Chybí pole:', missing.join(', '));
      return false;
    }
    
    console.log('✅ Všechna klíčová pole OK');
    console.log(`📧 Email: ${serviceAccount.client_email}`);
    console.log(`🆔 Project: ${serviceAccount.project_id}`);
    
    // 5. Kontrola private key formátu
    if (!serviceAccount.private_key.includes('BEGIN PRIVATE KEY')) {
      console.error('❌ Private key nemá správný formát');
      return false;
    }
    
    console.log('✅ Private key má správný formát');
    
    // 6. Test inicializace (bez skutečného připojení)
    console.log('✅ Základní validace úspěšná');
    
    console.log('\n🎉 RYCHLÝ TEST ÚSPĚŠNÝ!');
    console.log('💡 Pro plný test spusťte: node test-firebase-credentials.js');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Spuštění
quickTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
