const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function deleteAllArticles() {
  try {
    console.log('🗑️ Starting to delete all articles from Firebase...');
    
    // Get all articles
    const articlesRef = db.collection('articles');
    const snapshot = await articlesRef.get();
    
    if (snapshot.empty) {
      console.log('✅ No articles found to delete');
      return;
    }
    
    console.log(`📊 Found ${snapshot.size} articles to delete`);
    
    // Delete all articles in batches
    const batch = db.batch();
    let deleteCount = 0;
    
    snapshot.docs.forEach((doc) => {
      console.log(`🗑️ Deleting article: ${doc.data().title || doc.id}`);
      batch.delete(doc.ref);
      deleteCount++;
    });
    
    // Commit the batch
    await batch.commit();
    
    console.log(`✅ Successfully deleted ${deleteCount} articles from Firebase`);
    console.log('🎉 Firebase database is now clean - only real generated articles will remain');
    
  } catch (error) {
    console.error('❌ Error deleting articles:', error);
    process.exit(1);
  }
}

// Run the deletion
deleteAllArticles()
  .then(() => {
    console.log('🏁 Article deletion completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
