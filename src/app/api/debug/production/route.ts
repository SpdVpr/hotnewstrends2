import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      platform: process.env.VERCEL ? 'Vercel' : 'Local',
      region: process.env.VERCEL_REGION || 'unknown',
      
      // Environment variables check (without exposing values)
      envVars: {
        PERPLEXITY_API_KEY: !!process.env.PERPLEXITY_API_KEY,
        FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
        FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
        FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
        NODE_ENV: process.env.NODE_ENV,
      },
      
      // Runtime limits
      limits: {
        maxDuration: process.env.VERCEL ? '60s (Vercel)' : 'No limit (Local)',
        memory: process.env.VERCEL ? '1024MB (Hobby) / 3008MB (Pro)' : 'System limit',
        timeout: process.env.VERCEL ? '10s (Hobby) / 60s (Pro)' : 'No timeout',
      },
      
      // System info
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
      
      // Common issues checklist
      commonIssues: {
        coldStart: process.env.VERCEL ? 'Possible on Vercel' : 'Not applicable',
        timeoutRisk: 'Article generation can take 30-60s',
        memoryRisk: 'Multiple concurrent generations',
        apiLimits: 'Perplexity API rate limits',
        envVarMissing: Object.entries({
          PERPLEXITY_API_KEY: !!process.env.PERPLEXITY_API_KEY,
          FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
          FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
          FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
        }).filter(([_, exists]) => !exists).map(([key]) => key)
      }
    };
    
    return NextResponse.json({
      success: true,
      data: debugInfo
    });
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
