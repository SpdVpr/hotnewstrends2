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
      // Start trends scheduler automatically for continuous trend updates
      console.log('🚀 Starting trends scheduler for automatic trend updates...');
      try {
        const scheduler = await getTrendsScheduler();
        if (scheduler) {
          scheduler.start();
          console.log('✅ Trends scheduler started successfully');
        }
      } catch (schedulerError) {
        console.error('❌ Failed to start trends scheduler:', schedulerError);
        console.log('⚠️ Trends scheduler can be started manually from admin panel');
      }

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
