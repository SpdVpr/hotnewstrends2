import { NextRequest, NextResponse } from 'next/server';

// GET /api/test-csp - Test current CSP headers
export async function GET(request: NextRequest) {
  try {
    // Get the current CSP from headers
    const cspHeader = request.headers.get('content-security-policy');
    
    // Test CSP configuration
    const testResults = {
      currentCSP: cspHeader || 'No CSP header found',
      hasGoogleAnalytics: cspHeader?.includes('google-analytics.com') || false,
      hasRegion1: cspHeader?.includes('region1.google-analytics.com') || false,
      hasWildcard: cspHeader?.includes('*.google-analytics.com') || false,
      hasGoogleTagManager: cspHeader?.includes('googletagmanager.com') || false,
      timestamp: new Date().toISOString()
    };
    
    // Also return response headers to see what CSP is being sent
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'application/json');
    
    // Add test CSP header to see if it works
    responseHeaders.set('Content-Security-Policy', `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com;
      connect-src 'self' 
        https://www.google-analytics.com 
        https://region1.google-analytics.com 
        https://region2.google-analytics.com 
        https://region3.google-analytics.com 
        https://region4.google-analytics.com 
        https://region5.google-analytics.com 
        https://*.google-analytics.com 
        https://analytics.google.com 
        https://stats.g.doubleclick.net 
        https://www.googletagmanager.com;
    `.replace(/\s+/g, ' ').trim());
    
    return new NextResponse(JSON.stringify({
      success: true,
      csp: testResults,
      recommendation: {
        issue: !testResults.hasRegion1 ? 'region1.google-analytics.com not found in CSP' : 'CSP looks correct',
        solution: !testResults.hasRegion1 ? 'Add region1.google-analytics.com to connect-src' : 'CSP should work',
        nextSteps: [
          'Check if CSP is being cached',
          'Try hard refresh (Ctrl+F5)',
          'Check Network tab for CSP headers',
          'Verify deployment completed'
        ]
      }
    }, null, 2), {
      status: 200,
      headers: responseHeaders
    });

  } catch (error) {
    console.error('❌ Error testing CSP:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
