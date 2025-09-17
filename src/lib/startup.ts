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
      // Trends scheduler disabled - only daily plan system generates articles
      console.log('⚠️ Trends scheduler startup disabled - only daily plan system generates articles');
      console.log('📊 Use admin panel to manually control trends updates if needed');

      this.initialized = true;
      console.log('🎉 Application startup complete (trends scheduler disabled)');
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
