const admin = require('firebase-admin');
const serviceAccount = require('../auth-config.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkArticleCategories() {
  try {
    console.log('🔍 Checking Firebase articles categories...\n');
    
    const snapshot = await db.collection('articles')
      .orderBy('createdAt', 'desc')
      .limit(15)
      .get();
    
    console.log(`📊 Found ${snapshot.docs.length} articles in Firebase:\n`);
    
    const categoryStats = {};
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const category = data.category;
      
      console.log(`${index + 1}. ${data.title?.substring(0, 50)}...`);
      console.log(`   Category: ${JSON.stringify(category)}`);
      console.log(`   Type: ${typeof category}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Created: ${data.createdAt?.toDate?.()?.toISOString()?.substring(0, 10)}`);
      console.log('');
      
      // Count categories
      const categoryKey = typeof category === 'string' ? category : 
                         category?.name || category?.slug || category?.id || 'unknown';
      categoryStats[categoryKey] = (categoryStats[categoryKey] || 0) + 1;
    });
    
    console.log('📈 Category Statistics:');
    Object.entries(categoryStats).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} articles`);
    });
    
    console.log('\n🎯 Recommended category mapping:');
    Object.keys(categoryStats).forEach(cat => {
      const slug = cat.toLowerCase().replace(/[^a-z0-9]/g, '');
      console.log(`   "${cat}" → slug: "${slug}"`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkArticleCategories();
