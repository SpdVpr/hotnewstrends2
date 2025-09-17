import { NextRequest, NextResponse } from 'next/server';
import { firebaseArticlesService } from '@/lib/services/firebase-articles';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const article = await firebaseArticlesService.getArticleById(id);
    
    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: article
    });

  } catch (error) {
    console.error('❌ Error fetching article:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch article',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { title, excerpt, content, tags, seoTitle, seoDescription, status } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Update article in Firebase
    const updatedArticle = await firebaseArticlesService.updateArticle(id, {
      title,
      excerpt,
      content,
      tags: Array.isArray(tags) ? tags : [],
      seoTitle,
      seoDescription,
      status,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      data: updatedArticle
    });

  } catch (error) {
    console.error('❌ Error updating article:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update article',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await firebaseArticlesService.deleteArticle(id);

    return NextResponse.json({
      success: true,
      message: 'Article deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting article:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete article',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updatedArticle = await firebaseArticlesService.updateArticle(id, body);

    return NextResponse.json({
      success: true,
      data: updatedArticle
    });

  } catch (error) {
    console.error('❌ Error updating article:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update article',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


