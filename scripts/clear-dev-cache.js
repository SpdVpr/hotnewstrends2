#!/usr/bin/env node

/**
 * Development cache clearing utility
 * This script helps clear various caches that might cause stale content during development
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Clearing development caches...\n');

// Clear Next.js cache
const nextCacheDir = path.join(process.cwd(), '.next');
if (fs.existsSync(nextCacheDir)) {
  console.log('📁 Clearing Next.js cache (.next directory)...');
  try {
    fs.rmSync(nextCacheDir, { recursive: true, force: true });
    console.log('✅ Next.js cache cleared');
  } catch (error) {
    console.log('❌ Failed to clear Next.js cache:', error.message);
  }
} else {
  console.log('ℹ️  No Next.js cache found');
}

// Clear TypeScript build info
const tsBuildInfo = path.join(process.cwd(), 'tsconfig.tsbuildinfo');
if (fs.existsSync(tsBuildInfo)) {
  console.log('📁 Clearing TypeScript build info...');
  try {
    fs.unlinkSync(tsBuildInfo);
    console.log('✅ TypeScript build info cleared');
  } catch (error) {
    console.log('❌ Failed to clear TypeScript build info:', error.message);
  }
} else {
  console.log('ℹ️  No TypeScript build info found');
}

// Clear node_modules/.cache if it exists
const nodeModulesCache = path.join(process.cwd(), 'node_modules', '.cache');
if (fs.existsSync(nodeModulesCache)) {
  console.log('📁 Clearing node_modules cache...');
  try {
    fs.rmSync(nodeModulesCache, { recursive: true, force: true });
    console.log('✅ Node modules cache cleared');
  } catch (error) {
    console.log('❌ Failed to clear node modules cache:', error.message);
  }
} else {
  console.log('ℹ️  No node modules cache found');
}

console.log('\n🎉 Cache clearing complete!');
console.log('💡 Tips to prevent caching issues:');
console.log('   • Use "npm run dev:fresh" for development');
console.log('   • Open DevTools and check "Disable cache" in Network tab');
console.log('   • Use Ctrl+Shift+R (hard refresh) instead of Ctrl+F5');
console.log('   • Consider using incognito mode for testing');
