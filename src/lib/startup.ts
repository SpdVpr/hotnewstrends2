/**
 * Application Startup Service
 * Initializes services when the application starts
 */

// Only import server-side modules on server
let trendsScheduler: any = null;

// Dynamic import for server-side only
async function getTrendsScheduler() {
  if (typeof window !== 'undefined') {
    return null; // Skip on client-side
  }

  if (!trendsScheduler) {
    const module = await import('./services/trends-scheduler');
    trendsScheduler = module.trendsScheduler;
  }

  return trendsScheduler;
}

class StartupService {
  private initialized = false;

  /**
   * Initialize all startup services
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('⚠️ Startup services already initialized');
      return;
    }

    // Skip initialization on client-side
    if (typeof window !== 'undefined') {
      console.log('🚀 Client-side startup - skipping server services');
      this.initialized = true;
      return;
    }

    console.log('🚀 Initializing server-side application services...');

    try {
      // Trends scheduler DISABLED - using only Vercel cron jobs (3x daily)
      console.log('ℹ️ Trends scheduler disabled - using Vercel cron jobs only');
      console.log('📅 Scheduled updates: 08:00, 14:00, 20:00 UTC (3x daily)');
      console.log('⚠️ Manual scheduler start available from admin panel if needed');

      this.initialized = true;
      console.log('🎉 Server-side application startup complete');
    } catch (error) {
      console.error('❌ Error during application startup:', error);
    }
  }

  /**
   * Check if services are initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

export const startupService = new StartupService();
