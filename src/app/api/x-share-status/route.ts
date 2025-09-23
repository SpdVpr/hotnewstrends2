import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Getting X share status for all articles...');

    // Dynamic import to avoid client-side issues
    const { db } = await import('@/lib/firebase');
    const { collection, query, where, getDocs, orderBy, limit } = await import('firebase/firestore');

    // Get articles with X share status
    const articlesRef = collection(db, 'articles');
    const q = query(
      articlesRef,
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const articles = snapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      slug: doc.data().slug,
      publishedAt: doc.data().publishedAt,
      xShared: doc.data().xShared || false,
      xSharedAt: doc.data().xSharedAt,
      xTweetId: doc.data().xTweetId
    }));

    // Get X share logs for statistics
    const logsRef = collection(db, 'x_share_logs');
    const logsSnapshot = await getDocs(logsRef);
    const logs = logsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const stats = {
      totalArticles: articles.length,
      sharedArticles: articles.filter(a => a.xShared).length,
      unsharedArticles: articles.filter(a => !a.xShared).length,
      totalShares: logs.filter(log => log.success).length,
      failedShares: logs.filter(log => !log.success).length
    };

    console.log('📊 X Share Status:', stats);

    return NextResponse.json({
      success: true,
      articles,
      stats,
      logs: logs.slice(0, 10) // Last 10 logs
    });

  } catch (error: any) {
    console.error('❌ Error getting X share status:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
