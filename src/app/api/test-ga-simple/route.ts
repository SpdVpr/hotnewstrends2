import { NextRequest, NextResponse } from 'next/server';

// GET /api/test-ga-simple - Simple test page with only Google Analytics
export async function GET(request: NextRequest) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Google Analytics Test</title>
    
    <!-- Google Analytics - Official Implementation -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-29LL0RMMRY"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-29LL0RMMRY');
      
      // Test event
      setTimeout(() => {
        gtag('event', 'test_event', {
          event_category: 'test',
          event_label: 'simple_test',
          value: 1
        });
        console.log('✅ Test event sent to Google Analytics');
      }, 2000);
    </script>
</head>
<body>
    <h1>Google Analytics Simple Test</h1>
    <p>This page tests Google Analytics without any CSP or other interference.</p>
    <p>Check the console for messages and Network tab for GA requests.</p>
    
    <button onclick="testEvent()">Send Test Event</button>
    
    <script>
      function testEvent() {
        gtag('event', 'button_click', {
          event_category: 'engagement',
          event_label: 'test_button',
          value: 1
        });
        console.log('🎯 Button click event sent to Google Analytics');
      }
      
      // Log when GA is ready
      window.addEventListener('load', () => {
        console.log('📊 Page loaded, Google Analytics should be active');
        console.log('🔍 Check Network tab for requests to google-analytics.com');
      });
    </script>
</body>
</html>
  `;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      // No CSP header - completely unrestricted
    },
  });
}
