import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

// POST /api/mark-processed-direct - Directly mark a topic as processed
export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json();
    
    if (!keyword) {
      return NextResponse.json({
        success: false,
        error: 'Keyword is required'
      }, { status: 400 });
    }
    
    console.log(`🚫 Directly marking "${keyword}" as processed...`);
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // +48 hours
    const normalizedKeyword = keyword.toLowerCase().trim();
    const docId = normalizedKeyword.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
    
    const processedTopic = {
      keyword: normalizedKeyword,
      processedAt: Timestamp.fromDate(now),
      expiresAt: Timestamp.fromDate(expiresAt)
    };
    
    const docRef = doc(db, 'processed_topics', docId);
    await setDoc(docRef, processedTopic);
    
    console.log(`✅ Topic "${keyword}" marked as processed until ${expiresAt.toLocaleString()}`);
    
    return NextResponse.json({
      success: true,
      message: `Topic "${keyword}" marked as processed`,
      data: {
        keyword: normalizedKeyword,
        docId,
        processedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error marking topic as processed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to mark topic as processed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
