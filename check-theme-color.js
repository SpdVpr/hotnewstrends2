// Using built-in fetch in Node.js 18+

async function checkThemeColor() {
  try {
    const response = await fetch('http://localhost:3001/');
    const html = await response.text();
    
    // Check for theme-color meta tag
    const themeColorMatch = html.match(/<meta[^>]*name="theme-color"[^>]*>/);
    if (themeColorMatch) {
      console.log('✅ Theme color meta tag found:', themeColorMatch[0]);
    } else {
      console.log('❌ Theme color meta tag not found');
    }
    
    // Check if color is present anywhere
    if (html.includes('#007AFF')) {
      console.log('✅ Brand color #007AFF found in HTML');
    } else {
      console.log('❌ Brand color #007AFF not found in HTML');
    }
    
    // Check viewport
    const viewportMatch = html.match(/<meta[^>]*name="viewport"[^>]*>/);
    if (viewportMatch) {
      console.log('✅ Viewport meta tag found:', viewportMatch[0]);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkThemeColor();
