import { NextRequest, NextResponse } from 'next/server';

// Mock automation configuration - in production this would be stored in database
let automationConfig = {
  enabled: true,
  interval: 30, // minutes
  maxArticlesPerDay: 10,
  minConfidenceScore: 70,
  minGrowthRate: 50,
  categories: ['Technology', 'News', 'Business', 'Science'],
  schedule: {
    enabled: true,
    timezone: 'Europe/Prague',
    workingHours: {
      start: '08:00',
      end: '20:00'
    },
    workingDays: [1, 2, 3, 4, 5] // Monday to Friday
  },
  contentSettings: {
    minWordCount: 500,
    maxWordCount: 2000,
    includeImages: true,
    includeSources: true,
    seoOptimization: true
  },
  qualityFilters: {
    duplicateCheck: true,
    sentimentFilter: true,
    factCheck: false,
    readabilityScore: 60
  }
};

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: automationConfig
    });
  } catch (error) {
    console.error('❌ Error fetching automation config:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch automation config',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'enabled field is required and must be boolean' },
        { status: 400 }
      );
    }

    if (typeof body.interval !== 'number' || body.interval < 5 || body.interval > 1440) {
      return NextResponse.json(
        { success: false, error: 'interval must be between 5 and 1440 minutes' },
        { status: 400 }
      );
    }

    if (typeof body.maxArticlesPerDay !== 'number' || body.maxArticlesPerDay < 1 || body.maxArticlesPerDay > 100) {
      return NextResponse.json(
        { success: false, error: 'maxArticlesPerDay must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Update configuration
    automationConfig = {
      ...automationConfig,
      ...body,
      schedule: {
        ...automationConfig.schedule,
        ...(body.schedule || {})
      },
      contentSettings: {
        ...automationConfig.contentSettings,
        ...(body.contentSettings || {})
      },
      qualityFilters: {
        ...automationConfig.qualityFilters,
        ...(body.qualityFilters || {})
      }
    };

    console.log('✅ Automation config updated:', automationConfig);

    return NextResponse.json({
      success: true,
      data: automationConfig,
      message: 'Automation configuration updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating automation config:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update automation config',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
