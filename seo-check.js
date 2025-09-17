// SEO and Mobile Optimization Check
async function checkSEOAndMobile() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🔍 Checking SEO and Mobile Optimization...\n');
  
  // Check main pages
  const pagesToCheck = [
    { url: '/', name: 'Homepage' },
    { url: '/category/entertainment', name: 'Entertainment Category' },
    { url: '/category/technology', name: 'Technology Category' },
    { url: '/robots.txt', name: 'Robots.txt' },
    { url: '/sitemap.xml', name: 'Sitemap' },
    { url: '/feed.xml', name: 'RSS Feed' },
    { url: '/site.webmanifest', name: 'PWA Manifest' }
  ];
  
  for (const page of pagesToCheck) {
    try {
      console.log(`📄 Checking ${page.name}...`);
      const response = await fetch(`${baseUrl}${page.url}`);
      
      if (response.ok) {
        const content = await response.text();
        
        // Check for key SEO elements
        if (page.url === '/') {
          checkHomepageSEO(content);
        } else if (page.url.startsWith('/category/')) {
          checkCategoryPageSEO(content, page.name);
        } else if (page.url === '/robots.txt') {
          checkRobotsTxt(content);
        } else if (page.url === '/sitemap.xml') {
          checkSitemap(content);
        } else if (page.url === '/feed.xml') {
          checkRSSFeed(content);
        } else if (page.url === '/site.webmanifest') {
          checkPWAManifest(content);
        }
        
        console.log(`✅ ${page.name} - OK (${response.status})\n`);
      } else {
        console.log(`❌ ${page.name} - Error ${response.status}\n`);
      }
    } catch (error) {
      console.log(`❌ ${page.name} - Error: ${error.message}\n`);
    }
  }
}

function checkHomepageSEO(content) {
  const checks = [
    { name: 'Title tag', regex: /<title>.*HotNewsTrends.*<\/title>/ },
    { name: 'Meta description', regex: /<meta[^>]*name="description"[^>]*content="[^"]*AI-powered newsroom[^"]*"/ },
    { name: 'Viewport meta', regex: /<meta[^>]*name="viewport"[^>]*content="[^"]*width=device-width[^"]*"/ },
    { name: 'Open Graph title', regex: /<meta[^>]*property="og:title"/ },
    { name: 'Open Graph description', regex: /<meta[^>]*property="og:description"/ },
    { name: 'Twitter card', regex: /<meta[^>]*name="twitter:card"/ },
    { name: 'Structured data', regex: /<script[^>]*type="application\/ld\+json"/ },
    { name: 'Language attribute', regex: /<html[^>]*lang="en"/ },
    { name: 'Theme color', regex: /<meta[^>]*name="theme-color"/ }
  ];
  
  checks.forEach(check => {
    if (check.regex.test(content)) {
      console.log(`  ✅ ${check.name} found`);
    } else {
      console.log(`  ❌ ${check.name} missing`);
    }
  });
}

function checkCategoryPageSEO(content, pageName) {
  const checks = [
    { name: 'Title tag', regex: /<title>.*<\/title>/ },
    { name: 'Meta description', regex: /<meta[^>]*name="description"/ },
    { name: 'Canonical URL', regex: /<link[^>]*rel="canonical"/ },
    { name: 'Open Graph tags', regex: /<meta[^>]*property="og:/ }
  ];
  
  checks.forEach(check => {
    if (check.regex.test(content)) {
      console.log(`  ✅ ${check.name} found`);
    } else {
      console.log(`  ❌ ${check.name} missing`);
    }
  });
}

function checkRobotsTxt(content) {
  const hasUserAgent = content.includes('User-Agent: *');
  const hasSitemap = content.includes('hotnewstrends.com/sitemap.xml');
  const hasDisallow = content.includes('Disallow: /api/');

  if (hasUserAgent && hasSitemap && hasDisallow) {
    console.log('  ✅ Robots.txt properly configured');
  } else {
    console.log('  ❌ Robots.txt missing required directives');
    if (!hasUserAgent) console.log('    - Missing User-Agent directive');
    if (!hasSitemap) console.log('    - Missing Sitemap directive');
    if (!hasDisallow) console.log('    - Missing Disallow directives');
  }
}

function checkSitemap(content) {
  if (content.includes('<?xml') && content.includes('<urlset') && content.includes('entertainment')) {
    console.log('  ✅ Sitemap XML valid and includes Entertainment category');
  } else {
    console.log('  ❌ Sitemap issues detected');
  }
}

function checkRSSFeed(content) {
  if (content.includes('<?xml') && content.includes('<rss') && content.includes('Entertainment')) {
    console.log('  ✅ RSS feed valid and includes Entertainment category');
  } else {
    console.log('  ❌ RSS feed issues detected');
  }
}

function checkPWAManifest(content) {
  try {
    const manifest = JSON.parse(content);
    if (manifest.name && manifest.short_name && manifest.icons && manifest.start_url) {
      console.log('  ✅ PWA manifest valid');
      if (manifest.categories && manifest.categories.includes('entertainment')) {
        console.log('  ✅ Entertainment category included in PWA manifest');
      }
    } else {
      console.log('  ❌ PWA manifest missing required fields');
    }
  } catch (error) {
    console.log('  ❌ PWA manifest invalid JSON');
  }
}

checkSEOAndMobile();
