import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { articleId } = await request.json();

    if (!articleId) {
      return NextResponse.json({
        success: false,
        error: 'Article ID is required'
      }, { status: 400 });
    }

    console.log(`🐦 Manual X share request for article: ${articleId}`);

    // Dynamic import to avoid client-side issues
    const { xApiService } = await import('@/lib/services/x-api');
    const { db } = await import('@/lib/firebase');
    const { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } = await import('firebase/firestore');

    // Get article from Firebase
    const articleRef = doc(db, 'articles', articleId);
    const articleSnap = await getDoc(articleRef);

    if (!articleSnap.exists()) {
      return NextResponse.json({
        success: false,
        error: 'Article not found'
      }, { status: 404 });
    }

    const article = { id: articleSnap.id, ...articleSnap.data() };

    // Check if already shared
    if (article.xShared) {
      return NextResponse.json({
        success: false,
        error: 'Article already shared on X',
        sharedAt: article.xSharedAt
      }, { status: 400 });
    }

    // Check if X API is configured
    if (!xApiService.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'X API not configured'
      }, { status: 500 });
    }

    // Prepare tweet data with enhanced information
    const tweetData = {
      title: article.title,
      url: `https://hotnewstrends.com/article/${article.slug}`,
      category: article.category?.name || 'News',
      tags: article.tags || [],
      excerpt: article.excerpt || '',
      content: article.content || '',
      imageUrl: article.imageUrl || article.image || null
    };

    console.log('🐦 Posting tweet for article:', article.title);

    // Post to X
    const result = await xApiService.postTweet(tweetData);

    if (result.success && result.tweetId) {
      // Update article with X share info
      await updateDoc(articleRef, {
        xShared: true,
        xSharedAt: serverTimestamp(),
        xTweetId: result.tweetId
      });

      // Log the share
      await addDoc(collection(db, 'x_share_logs'), {
        articleId: articleId,
        articleTitle: article.title,
        tweetId: result.tweetId,
        tweetText: result.tweetText,
        success: true,
        sharedAt: serverTimestamp(),
        method: 'manual'
      });

      console.log('✅ Article shared successfully on X:', result.tweetId);

      return NextResponse.json({
        success: true,
        tweetId: result.tweetId,
        tweetText: result.tweetText,
        message: 'Article shared successfully on X'
      });

    } else {
      // Log failed attempt
      await addDoc(collection(db, 'x_share_logs'), {
        articleId: articleId,
        articleTitle: article.title,
        tweetText: result.tweetText || null,
        success: false,
        error: result.error || 'Unknown error',
        sharedAt: serverTimestamp(),
        method: 'manual'
      });

      console.error('❌ Failed to share article on X:', result.error);

      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to share on X'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ X share article error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
