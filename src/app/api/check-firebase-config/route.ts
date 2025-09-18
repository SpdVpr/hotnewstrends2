import { NextRequest, NextResponse } from 'next/server';

// GET /api/check-firebase-config - Check Firebase configuration
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking Firebase configuration...');
    
    // Check environment variables
    const firebaseConfig = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'NOT_SET',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      
      // Server-side config
      serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 'SET' : 'NOT_SET',
      serviceAccountKeyLength: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.length || 0,
      serviceAccountKeyPreview: process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY.substring(0, 50) + '...' : 'NOT_SET'
    };
    
    // Try to initialize Firebase
    let firebaseStatus = {
      initialized: false,
      error: null,
      collections: {}
    };
    
    try {
      const { db } = await import('@/lib/firebase');
      firebaseStatus.initialized = true;
      
      // Test collections access
      const collections = ['trends', 'articles', 'automation_jobs', 'daily_plans'];
      for (const collectionName of collections) {
        try {
          const { collection, getDocs, limit, query } = await import('firebase/firestore');
          const collectionRef = collection(db, collectionName);
          const q = query(collectionRef, limit(1));
          const snapshot = await getDocs(q);
          firebaseStatus.collections[collectionName] = {
            accessible: true,
            documentCount: snapshot.size
          };
        } catch (collError) {
          firebaseStatus.collections[collectionName] = {
            accessible: false,
            error: collError instanceof Error ? collError.message : 'Unknown error'
          };
        }
      }
    } catch (error) {
      firebaseStatus.error = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Check if we can write to Firebase
    let writeTest = {
      canWrite: false,
      error: null
    };
    
    if (firebaseStatus.initialized) {
      try {
        const { firebaseTrendsService } = await import('@/lib/services/firebase-trends');
        // Try to get trends (read test)
        const trends = await firebaseTrendsService.getLatestTrends(1);
        writeTest.canWrite = true;
        writeTest.readTest = `Successfully read ${trends.length} trends`;
      } catch (error) {
        writeTest.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        firebaseConfig,
        firebaseStatus,
        writeTest,
        recommendations: [
          !firebaseConfig.serviceAccountKey || firebaseConfig.serviceAccountKey === 'NOT_SET' ? 
            'CRITICAL: Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable' : null,
          firebaseConfig.serviceAccountKeyLength < 100 ? 
            'WARNING: Service account key seems too short' : null,
          !firebaseStatus.initialized ? 
            'ERROR: Firebase initialization failed' : null,
          !writeTest.canWrite ? 
            'ERROR: Cannot read/write to Firebase' : null
        ].filter(Boolean)
      }
    });

  } catch (error) {
    console.error('❌ Error checking Firebase config:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
