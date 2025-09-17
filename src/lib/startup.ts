/**
 * Application Startup Service
 * Initializes services when the application starts
 */

import { trendsScheduler } from './services/trends-scheduler';

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

    console.log('🚀 Initializing application services...');

    try {
      // Start trends scheduler (6x daily updates)
      console.log('📊 Starting trends scheduler...');
      trendsScheduler.start();

      // Verify scheduler is running
      const stats = trendsScheduler.getStats();
      console.log('📈 Trends scheduler status:', {
        isRunning: stats.isRunning,
        lastUpdate: stats.lastUpdate,
        nextUpdate: stats.nextUpdate,
        updatesPerDay: stats.updatesPerDay
      });

      this.initialized = true;
      console.log('🎉 Application startup complete');
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
