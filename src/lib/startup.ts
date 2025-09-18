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
      // Start trends scheduler automatically for continuous trend updates
      console.log('🚀 Starting trends scheduler for automatic trend updates...');
      try {
        trendsScheduler.start();
        console.log('✅ Trends scheduler started successfully');
      } catch (schedulerError) {
        console.error('❌ Failed to start trends scheduler:', schedulerError);
        console.log('⚠️ Trends scheduler can be started manually from admin panel');
      }

      this.initialized = true;
      console.log('🎉 Application startup complete with trends scheduler');
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
