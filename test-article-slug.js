const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const serviceAccount = require('./auth-config.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function testArticleSlug() {
  const slug = 'abhishek-sharma-ignites-asia-cup-2025-inside-the-fiery-india-pakistan-showdown';
  
  console.log(`🔍 Searching for article with slug: "${slug}"`);
  
  try {
    // Try to find article by slug
    const snapshot = await db.collection('articles')
      .where('slug', '==', slug)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      console.log('❌ Article NOT found in Firebase');
      
      // Let's check if there are any articles with similar slug
      console.log('\n🔍 Searching for similar slugs...');
      const allArticles = await db.collection('articles')
        .orderBy('createdAt', 'desc')
        .limit(500)
        .get();
      
      const similarSlugs = [];
      allArticles.forEach(doc => {
        const data = doc.data();
        if (data.slug && data.slug.includes('abhishek')) {
          similarSlugs.push({
            id: doc.id,
            slug: data.slug,
            title: data.title,
            status: data.status
          });
        }
      });
      
      if (similarSlugs.length > 0) {
        console.log('📋 Found similar slugs:');
        similarSlugs.forEach(article => {
          console.log(`  - ${article.slug} (${article.status})`);
          console.log(`    Title: ${article.title}`);
        });
      } else {
        console.log('❌ No similar slugs found');
      }
      
      // Check total articles count
      console.log(`\n📊 Total articles checked: ${allArticles.size}`);
      
    } else {
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log('✅ Article found:', {
          id: doc.id,
          title: data.title,
          slug: data.slug,
          status: data.status,
          publishedAt: data.publishedAt?.toDate?.(),
          createdAt: data.createdAt?.toDate?.()
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

testArticleSlug();

