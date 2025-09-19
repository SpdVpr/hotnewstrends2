import { NextRequest, NextResponse } from 'next/server';

// GET /api/test-image - Test if an image URL is accessible
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({
        success: false,
        error: 'Image URL is required. Use ?url=https://example.com/image.jpg'
      }, { status: 400 });
    }

    console.log(`🖼️ Testing image URL: ${imageUrl}`);

    // Test if the image is accessible
    const response = await fetch(imageUrl, {
      method: 'HEAD', // Only get headers, not the full image
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HotNewsTrends/1.0)'
      }
    });

    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    const lastModified = response.headers.get('last-modified');

    const result = {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      url: imageUrl,
      headers: {
        contentType,
        contentLength: contentLength ? parseInt(contentLength) : null,
        lastModified
      },
      isImage: contentType?.startsWith('image/') || false,
      sizeKB: contentLength ? Math.round(parseInt(contentLength) / 1024) : null
    };

    console.log(`🖼️ Image test result:`, result);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Error testing image:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to fetch image URL'
    }, { status: 500 });
  }
}

// POST /api/test-image - Test multiple image URLs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({
        success: false,
        error: 'URLs array is required'
      }, { status: 400 });
    }

    console.log(`🖼️ Testing ${urls.length} image URLs...`);

    const results = await Promise.allSettled(
      urls.map(async (url: string) => {
        try {
          const response = await fetch(url, {
            method: 'HEAD',
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; HotNewsTrends/1.0)'
            }
          });

          const contentType = response.headers.get('content-type');
          const contentLength = response.headers.get('content-length');

          return {
            url,
            success: response.ok,
            status: response.status,
            contentType,
            sizeKB: contentLength ? Math.round(parseInt(contentLength) / 1024) : null,
            isImage: contentType?.startsWith('image/') || false
          };
        } catch (error) {
          return {
            url,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const processedResults = results.map((result, index) => ({
      index,
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : { error: result.reason }
    }));

    const summary = {
      total: urls.length,
      successful: processedResults.filter(r => r.status === 'fulfilled' && r.data.success).length,
      failed: processedResults.filter(r => r.status === 'rejected' || !r.data.success).length
    };

    return NextResponse.json({
      success: true,
      data: {
        summary,
        results: processedResults
      }
    });

  } catch (error) {
    console.error('❌ Error testing images:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
