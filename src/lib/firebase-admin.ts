/**
 * Firebase Admin SDK - Server-side only
 * This file should only be imported on the server-side
 */

import 'server-only';

let adminInstance: any = null;
let dbInstance: any = null;
let initialized = false;

/**
 * Initialize Firebase Admin SDK
 * Only works on server-side
 */
export async function initializeFirebaseAdmin(): Promise<{ admin: any; db: any } | null> {
  // Skip on client-side
  if (typeof window !== 'undefined') {
    console.log('🔥 Skipping Firebase Admin initialization on client-side');
    return null;
  }

  // Return cached instances if already initialized
  if (initialized && adminInstance && dbInstance) {
    return { admin: adminInstance, db: dbInstance };
  }

  try {
    console.log('🔥 Initializing Firebase Admin SDK...');

    // Dynamic import Firebase Admin
    const admin = await import('firebase-admin');
    adminInstance = admin;

    // Check if already initialized
    if (admin.apps.length > 0) {
      console.log('🔥 Firebase Admin already initialized, using existing instance');
      dbInstance = admin.firestore();
      initialized = true;
      return { admin: adminInstance, db: dbInstance };
    }

    // Get service account key from environment
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKey) {
      console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY environment variable not found');
      console.error('❌ Firebase Admin initialization failed - service account key missing');
      initialized = true;
      return null;
    }

    console.log('🔍 Parsing Firebase service account key...');
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountKey);
      console.log('✅ Service account key parsed successfully');
      console.log(`📧 Client email: ${serviceAccount.client_email}`);
      console.log(`🆔 Project ID: ${serviceAccount.project_id}`);
    } catch (parseError) {
      console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', parseError);
      console.error('❌ Make sure the environment variable contains valid JSON');
      initialized = true;
      return null;
    }

    // Initialize Firebase Admin
    console.log('🔥 Initializing Firebase Admin with service account...');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });

    dbInstance = admin.firestore();
    initialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log('✅ Firestore database connection established');
    
    return { admin: adminInstance, db: dbInstance };

  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    console.error('❌ Stack trace:', error.stack);
    adminInstance = null;
    dbInstance = null;
    initialized = true;
    return null;
  }
}

/**
 * Get Firebase Admin instances (lazy initialization)
 */
export async function getFirebaseAdmin(): Promise<{ admin: any; db: any } | null> {
  if (!initialized || !adminInstance || !dbInstance) {
    return await initializeFirebaseAdmin();
  }
  return { admin: adminInstance, db: dbInstance };
}

/**
 * Store service status in Firebase
 */
export async function storeServiceStatus(isRunning: boolean): Promise<boolean> {
  try {
    const firebase = await getFirebaseAdmin();
    if (!firebase || !firebase.db) {
      console.error('❌ Firebase Admin not available for storing service status');
      return false;
    }

    const { admin, db } = firebase;
    const statusData = {
      isRunning,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      environment: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      updatedBy: 'automated-article-generator'
    };

    await db.collection('system').doc('article_generator_service_status').set(statusData, { merge: true });
    console.log(`📊 Service status stored in Firebase: isRunning=${isRunning}`);
    return true;

  } catch (error) {
    console.error('❌ Failed to store service status in Firebase:', error);
    return false;
  }
}

/**
 * Load service status from Firebase
 */
export async function loadServiceStatus(): Promise<boolean> {
  try {
    const firebase = await getFirebaseAdmin();
    if (!firebase || !firebase.db) {
      console.error('❌ Firebase Admin not available for loading service status');
      return false;
    }

    const { db } = firebase;
    const doc = await db.collection('system').doc('article_generator_service_status').get();
    
    if (doc.exists) {
      const data = doc.data();
      const isRunning = data?.isRunning || false;
      console.log(`📊 Service status loaded from Firebase: isRunning=${isRunning}`);
      return isRunning;
    } else {
      console.log('📊 No service status document found in Firebase, defaulting to false');
      return false;
    }

  } catch (error) {
    console.error('❌ Failed to load service status from Firebase:', error);
    return false;
  }
}
