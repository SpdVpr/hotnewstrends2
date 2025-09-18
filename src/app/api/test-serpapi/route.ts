import { NextRequest, NextResponse } from 'next/server';

// GET /api/test-serpapi - Test SerpAPI connection and data
export async function GET(request: NextRequest) {
  try {
    const serpApiKey = process.env.SERPAPI_KEY;
    
    if (!serpApiKey) {
      return NextResponse.json({
        success: false,
        error: 'SERPAPI_KEY not found in environment variables',
        hasKey: false
      });
    }

    console.log('🔑 SerpAPI Key found:', serpApiKey ? `${serpApiKey.substring(0, 10)}...` : 'NO KEY');

    // Test SerpAPI call
    const response = await fetch(`https://serpapi.com/search?engine=google_trends_trending_now&geo=US&api_key=${serpApiKey}`);
    const data = await response.json();

    console.log('📡 SerpAPI Response Status:', response.status);
    console.log('📊 SerpAPI Response Data Keys:', Object.keys(data));
    
    if (data.trending_searches) {
      console.log(`✅ SerpAPI Success: ${data.trending_searches.length} trending searches found`);
      console.log('🔍 First 3 trends:', data.trending_searches.slice(0, 3).map((item: any) => ({
        query: item.query,
        traffic: item.traffic,
        category: item.category
      })));
    } else {
      console.log('❌ SerpAPI Error or No Data:', data);
    }

    return NextResponse.json({
      success: response.ok,
      hasKey: true,
      keyPreview: `${serpApiKey.substring(0, 10)}...`,
      responseStatus: response.status,
      dataKeys: Object.keys(data),
      hasTrendingSearches: !!data.trending_searches,
      trendingSearchesCount: data.trending_searches?.length || 0,
      firstTrend: data.trending_searches?.[0] || null,
      errorMessage: data.error || null,
      rawResponse: data
    });

  } catch (error) {
    console.error('❌ SerpAPI Test Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasKey: !!process.env.SERPAPI_KEY
    }, { status: 500 });
  }
}
