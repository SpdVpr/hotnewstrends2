// Performance Testing Script
async function testPerformanceOptimizations() {
  const baseUrl = 'http://localhost:3001';

  console.log('🚀 Testing Performance Optimizations...\n');

  try {
    // Test homepage first
    console.log('📄 Testing Homepage...');
    const startTime = Date.now();
    const response = await fetch(`${baseUrl}/`);
    const html = await response.text();
    const loadTime = Date.now() - startTime;

    // Also test a category page which should have images
    console.log('📄 Testing Category Page...');
    const categoryStartTime = Date.now();
    const categoryResponse = await fetch(`${baseUrl}/category/entertainment`);
    const categoryHtml = await categoryResponse.text();
    const categoryLoadTime = Date.now() - categoryStartTime;

    // Use category page for image analysis if homepage has no images
    const testHtml = html.includes('<img') ? html : categoryHtml;

    console.log(`📊 Homepage Load Time: ${loadTime}ms`);
    console.log(`📊 Category Load Time: ${categoryLoadTime}ms\n`);

    // Test 1: Check for preconnect links
    console.log('🔗 Preconnect Links Analysis:');
    const preconnectMatches = testHtml.match(/<link[^>]*rel="preconnect"[^>]*>/g);
    if (preconnectMatches) {
      console.log(`  ✅ Found ${preconnectMatches.length} preconnect links:`);
      preconnectMatches.forEach((link, index) => {
        const href = link.match(/href="([^"]*)"/) || [];
        console.log(`    ${index + 1}. ${href[1] || 'Unknown'}`);
      });
    } else {
      console.log('  ❌ No preconnect links found');
    }
    
    // Test 2: Check for DNS prefetch
    console.log('\n🌐 DNS Prefetch Analysis:');
    const dnsPrefetchMatches = testHtml.match(/<link[^>]*rel="dns-prefetch"[^>]*>/g);
    if (dnsPrefetchMatches) {
      console.log(`  ✅ Found ${dnsPrefetchMatches.length} DNS prefetch links`);
    } else {
      console.log('  ❌ No DNS prefetch links found');
    }

    // Test 3: Check for optimized images
    console.log('\n🖼️ Image Optimization Analysis:');
    const imageMatches = testHtml.match(/<img[^>]*>/g) || [];
    let optimizedImages = 0;
    let priorityImages = 0;
    let lazyImages = 0;
    
    imageMatches.forEach(img => {
      if (img.includes('fetchpriority="high"') || img.includes('priority')) {
        priorityImages++;
      }
      if (img.includes('loading="lazy"')) {
        lazyImages++;
      }
      if (img.includes('sizes=')) {
        optimizedImages++;
      }
    });
    
    console.log(`  📸 Total images: ${imageMatches.length}`);
    console.log(`  ⚡ Priority images: ${priorityImages}`);
    console.log(`  🐌 Lazy loaded images: ${lazyImages}`);
    console.log(`  📐 Responsive images: ${optimizedImages}`);
    
    // Test 4: Check for critical CSS
    console.log('\n🎨 CSS Optimization Analysis:');
    const inlineStyles = testHtml.match(/<style[^>]*>(.*?)<\/style>/gs) || [];
    console.log(`  📝 Inline styles: ${inlineStyles.length}`);

    const externalCSS = testHtml.match(/<link[^>]*rel="stylesheet"[^>]*>/g) || [];
    console.log(`  🔗 External CSS files: ${externalCSS.length}`);

    // Test 5: Check for font optimization
    console.log('\n🔤 Font Optimization Analysis:');
    const fontPreloads = testHtml.match(/<link[^>]*rel="preload"[^>]*as="font"[^>]*>/g) || [];
    console.log(`  ⚡ Font preloads: ${fontPreloads.length}`);

    const fontDisplay = testHtml.includes('font-display:swap') || testHtml.includes('display=swap');
    console.log(`  🔄 Font display swap: ${fontDisplay ? '✅ Enabled' : '❌ Not found'}`);

    // Test 6: Check for performance monitoring
    console.log('\n📈 Performance Monitoring:');
    const hasPerformanceMonitor = testHtml.includes('PerformanceMonitor') || testHtml.includes('web-vitals');
    console.log(`  📊 Performance monitoring: ${hasPerformanceMonitor ? '✅ Enabled' : '❌ Not found'}`);

    // Test 7: Check for LCP optimization
    console.log('\n🎯 LCP Optimization:');
    const lcpElements = testHtml.match(/data-lcp="true"/g) || [];
    console.log(`  🎯 LCP marked elements: ${lcpElements.length}`);

    const fetchPriorityHigh = testHtml.match(/fetchpriority="high"/g) || [];
    console.log(`  ⚡ High priority fetches: ${fetchPriorityHigh.length}`);

    // Test 8: Resource hints analysis
    console.log('\n💡 Resource Hints Summary:');
    const resourceHints = {
      preconnect: (testHtml.match(/rel="preconnect"/g) || []).length,
      dnsPrefetch: (testHtml.match(/rel="dns-prefetch"/g) || []).length,
      preload: (testHtml.match(/rel="preload"/g) || []).length,
      prefetch: (testHtml.match(/rel="prefetch"/g) || []).length
    };
    
    Object.entries(resourceHints).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} hints`);
    });
    
    // Performance Score Calculation
    console.log('\n🏆 Performance Optimization Score:');
    let score = 0;
    let maxScore = 0;
    
    // Scoring criteria
    const criteria = [
      { name: 'Preconnect links', current: preconnectMatches?.length || 0, target: 4, weight: 15 },
      { name: 'Priority images', current: priorityImages, target: 3, weight: 20 },
      { name: 'Lazy loaded images', current: lazyImages, target: imageMatches.length - 3, weight: 15 },
      { name: 'Responsive images', current: optimizedImages, target: imageMatches.length, weight: 15 },
      { name: 'Font optimization', current: fontDisplay ? 1 : 0, target: 1, weight: 10 },
      { name: 'Performance monitoring', current: hasPerformanceMonitor ? 1 : 0, target: 1, weight: 10 },
      { name: 'LCP optimization', current: lcpElements.length > 0 ? 1 : 0, target: 1, weight: 15 }
    ];
    
    criteria.forEach(criterion => {
      const points = Math.min(criterion.current / criterion.target, 1) * criterion.weight;
      score += points;
      maxScore += criterion.weight;
      
      const percentage = Math.round((criterion.current / criterion.target) * 100);
      console.log(`  ${criterion.name}: ${points.toFixed(1)}/${criterion.weight} (${percentage}%)`);
    });
    
    const finalScore = Math.round((score / maxScore) * 100);
    console.log(`\n🎯 Overall Performance Score: ${finalScore}/100`);
    
    if (finalScore >= 90) {
      console.log('🏆 Excellent! Your site is highly optimized.');
    } else if (finalScore >= 75) {
      console.log('👍 Good optimization, but there\'s room for improvement.');
    } else if (finalScore >= 60) {
      console.log('⚠️ Moderate optimization, several areas need attention.');
    } else {
      console.log('❌ Poor optimization, significant improvements needed.');
    }
    
  } catch (error) {
    console.error('❌ Error testing performance:', error.message);
  }
}

testPerformanceOptimizations();
